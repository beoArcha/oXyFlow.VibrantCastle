import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize, resolve } from "node:path";
import type { LongFrameObserverType } from "./parallaxTypes";

export type PerfBrowserKind = "chromium" | "firefox" | "webkit";

const MIME_TYPES: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function findMsPlaywrightExecutable(
  msPlaywrightDir: string,
  dirPrefix: string,
  relativeExeSegments: readonly string[]
): string | undefined {
  if (!existsSync(msPlaywrightDir)) return undefined;
  const entries = readdirSync(msPlaywrightDir)
    .filter((entry) => entry.startsWith(dirPrefix))
    .sort()
    .reverse();
  for (const entry of entries) {
    const candidate = join(msPlaywrightDir, entry, ...relativeExeSegments);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Resolves the Playwright browser executable path from explicit env overrides
 * (`PLAYWRIGHT_<BROWSER>_PATH`), falling back to local Windows `ms-playwright`
 * directories when present, or undefined to let playwright-core use its default.
 */
export function resolveBrowserExecutablePath(
  browserKind: PerfBrowserKind = "chromium",
  env: Record<string, string | undefined> = process.env
): string | undefined {
  const envKey =
    browserKind === "firefox"
      ? "PLAYWRIGHT_FIREFOX_PATH"
      : browserKind === "webkit"
        ? "PLAYWRIGHT_WEBKIT_PATH"
        : "PLAYWRIGHT_CHROMIUM_PATH";
  const configured = env[envKey]?.trim();
  if (configured) return configured;

  if (env.LOCALAPPDATA) {
    const msPlaywrightDir = join(env.LOCALAPPDATA, "ms-playwright");
    if (browserKind === "chromium") {
      return findMsPlaywrightExecutable(msPlaywrightDir, "chromium-", ["chrome-win64", "chrome.exe"]);
    }
    if (browserKind === "firefox") {
      return findMsPlaywrightExecutable(msPlaywrightDir, "firefox-", ["firefox", "firefox.exe"]);
    }
    if (browserKind === "webkit") {
      return findMsPlaywrightExecutable(msPlaywrightDir, "webkit-", ["Playwright.exe"]);
    }
  }

  return undefined;
}

/**
 * Resolves the Chromium executable path from PLAYWRIGHT_CHROMIUM_PATH,
 * falling back to the local Windows ms-playwright binary when present,
 * or undefined to let playwright-core choose its default browser (e.g. Linux CI).
 */
export function resolveChromiumExecutablePath(
  env: Record<string, string | undefined> = process.env
): string | undefined {
  return resolveBrowserExecutablePath("chromium", env);
}

export interface StaticServerHandle {
  readonly baseUrl: string;
  stop: () => Promise<void>;
}

/**
 * Serves a built Vite output directory over localhost on an ephemeral port.
 */
export async function startStaticBuildServer(rootDir: string): Promise<StaticServerHandle> {
  const absRoot = resolve(rootDir);

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const rawUrl = req.url ?? "/";
    const parsedPath = decodeURIComponent(rawUrl.split("?")[0] || "/");
    const relPath = parsedPath === "/" ? "/index.html" : parsedPath;
    const candidate = normalize(join(absRoot, relPath));

    if (!candidate.startsWith(absRoot) || !existsSync(candidate) || !statSync(candidate).isFile()) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }

    const contentType = MIME_TYPES[extname(candidate).toLowerCase()] ?? "application/octet-stream";
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.end(readFileSync(candidate));
  });

  await new Promise<void>((resolveReady) => {
    server.listen(0, "127.0.0.1", () => resolveReady());
  });

  const address = server.address() as AddressInfo | null;
  const port = address ? address.port : 0;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    stop: () =>
      new Promise<void>((resolveClose) => {
        server.close(() => resolveClose());
      }),
  };
}

export interface InPagePerfSnapshot {
  readonly workDurationsMs: readonly number[];
  readonly deltasMs: readonly number[];
  readonly longFrameObserverType: LongFrameObserverType;
  readonly longFrameCount: number;
  readonly longFrameTotalBlockingTimeMs: number;
  readonly longFrameMaxDurationMs: number;
  readonly firstParallaxFrameMs: number | null;
  readonly jsHeapUsedBytes: number | null;
  readonly jsHeapTotalBytes: number | null;
  readonly decodedImagesCount: number;
  readonly decodedImagesTotalBytes: number;
  readonly decodedParallaxCount: number;
  readonly decodedParallaxBytes: number;
}

export interface InPagePerfProbeHandle {
  hasFirstParallaxFrame(): boolean;
  startSampling(): void;
  stopSampling(): void;
  getSnapshot(): InPagePerfSnapshot;
}

/**
 * Returns the self-contained browser init script injected before app code executes.
 * Wraps requestAnimationFrame to measure per-frame JS/canvas work duration, observes
 * long-animation-frame / longtask entries from page entry, records rAF cadence intervals,
 * and captures time-to-first-parallax-frame and decoded image byte totals.
 */
export function buildInPagePerfInitScript(): string {
  return `(() => {
    const PARALLAX_PATH_RE = /\\/(?:bg|parallax)\\//i;
    const PARALLAX_NAME_RE = /(?:^|\\/)(?:courtyard|thorn_chasm|ashen_catacombs|clocktower|alchemist_library|aether_sanctuary|grand_bastion|eclipse_crown|shared_mid|boss_stage|boss_world|fx_)[a-z0-9_-]*(?:far|mid|close|var_[a-e]|sigil|throne|spires|shelves|arches)/i;

    function isParallaxUrl(src) {
      if (!src) return false;
      return PARALLAX_PATH_RE.test(src) || PARALLAX_NAME_RE.test(src);
    }

    const trackedImages = new Set();
    const trackedBitmaps = new Set();

    const NativeImage = window.Image;
    function TrackedImage(width, height) {
      const img = width === undefined ? new NativeImage() : new NativeImage(width, height);
      trackedImages.add(img);
      return img;
    }
    TrackedImage.prototype = NativeImage.prototype;
    Object.setPrototypeOf(TrackedImage, NativeImage);
    window.Image = TrackedImage;

    if (typeof window.createImageBitmap === "function") {
      const origCreateBitmap = window.createImageBitmap.bind(window);
      window.createImageBitmap = async function (...args) {
        const bitmap = await origCreateBitmap(...args);
        const src = args[0] && typeof args[0].src === "string" ? args[0].src : "";
        trackedBitmaps.add({ bitmap, isParallax: isParallaxUrl(src) });
        return bitmap;
      };
    }

    let firstParallaxFrameMs = null;
    const origDrawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (source, ...rest) {
      if (firstParallaxFrameMs === null && this.canvas && this.canvas.id === "game-viewport-canvas") {
        const isHtmlImg = typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement;
        const isBitmap = typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap;
        if (isHtmlImg && source.complete && source.naturalWidth > 0 && isParallaxUrl(source.currentSrc || source.src)) {
          firstParallaxFrameMs = performance.now();
          CanvasRenderingContext2D.prototype.drawImage = origDrawImage;
        } else if (isBitmap && source.width >= 512 && source.height >= 256) {
          firstParallaxFrameMs = performance.now();
          CanvasRenderingContext2D.prototype.drawImage = origDrawImage;
        }
      }
      return origDrawImage.call(this, source, ...rest);
    };

    let longFrameObserverType = "none";
    let longFrameCount = 0;
    let longFrameTotalBlockingTimeMs = 0;
    let longFrameMaxDurationMs = 0;
    let longFrameObserver = null;

    function recordLongEntries(entries) {
      for (const entry of entries) {
        const duration = typeof entry.duration === "number" ? entry.duration : 0;
        const blocking =
          typeof entry.blockingDuration === "number"
            ? entry.blockingDuration
            : Math.max(0, duration - 50);
        longFrameCount++;
        longFrameTotalBlockingTimeMs += blocking;
        if (duration > longFrameMaxDurationMs) {
          longFrameMaxDurationMs = duration;
        }
      }
    }

    if (typeof PerformanceObserver !== "undefined") {
      const supported = Array.isArray(PerformanceObserver.supportedEntryTypes)
        ? PerformanceObserver.supportedEntryTypes
        : [];
      const candidateType = supported.includes("long-animation-frame")
        ? "long-animation-frame"
        : supported.includes("longtask")
          ? "longtask"
          : null;
      if (candidateType) {
        try {
          longFrameObserverType = candidateType;
          longFrameObserver = new PerformanceObserver((list) => {
            recordLongEntries(list.getEntries());
          });
          longFrameObserver.observe({ type: candidateType, buffered: true });
        } catch {
          longFrameObserverType = "none";
          longFrameObserver = null;
        }
      }
    }

    let sampling = false;
    let rafId = 0;
    let lastTs = 0;
    let deltasMs = [];
    let workDurationsMs = [];

    // Keep the native rAF reference so the cadence sampler does not record itself as app work.
    const origRaf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (callback) {
      return origRaf(function (timestamp) {
        if (!sampling) {
          return callback(timestamp);
        }
        const start = performance.now();
        try {
          return callback(timestamp);
        } finally {
          workDurationsMs.push(performance.now() - start);
        }
      });
    };

    function onFrame(now) {
      if (!sampling) return;
      if (lastTs > 0) {
        deltasMs.push(now - lastTs);
      }
      lastTs = now;
      rafId = origRaf(onFrame);
    }

    window.__vcParallaxPerf = {
      hasFirstParallaxFrame() {
        return firstParallaxFrameMs !== null;
      },
      startSampling() {
        workDurationsMs = [];
        deltasMs = [];
        lastTs = 0;
        sampling = true;
        rafId = origRaf(onFrame);
      },
      stopSampling() {
        sampling = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
      },
      getSnapshot() {
        if (longFrameObserver && typeof longFrameObserver.takeRecords === "function") {
          recordLongEntries(longFrameObserver.takeRecords());
        }

        const seenUrls = new Set();
        let decodedImagesCount = 0;
        let decodedImagesTotalBytes = 0;
        let decodedParallaxCount = 0;
        let decodedParallaxBytes = 0;

        for (const img of trackedImages) {
          const url = img.currentSrc || img.src || "";
          if (!url || !img.complete || img.naturalWidth <= 0) continue;
          if (seenUrls.has(url)) continue;
          seenUrls.add(url);
          const bytes = img.naturalWidth * img.naturalHeight * 4;
          decodedImagesCount++;
          decodedImagesTotalBytes += bytes;
          if (isParallaxUrl(url)) {
            decodedParallaxCount++;
            decodedParallaxBytes += bytes;
          }
        }

        for (const entry of trackedBitmaps) {
          const bmp = entry.bitmap;
          if (!bmp || bmp.width <= 0 || bmp.height <= 0) continue;
          const bytes = bmp.width * bmp.height * 4;
          decodedImagesCount++;
          decodedImagesTotalBytes += bytes;
          if (entry.isParallax) {
            decodedParallaxCount++;
            decodedParallaxBytes += bytes;
          }
        }

        const mem = performance && performance.memory ? performance.memory : null;
        return {
          workDurationsMs: workDurationsMs.slice(),
          deltasMs: deltasMs.slice(),
          longFrameObserverType,
          longFrameCount,
          longFrameTotalBlockingTimeMs,
          longFrameMaxDurationMs,
          firstParallaxFrameMs,
          jsHeapUsedBytes: mem ? mem.usedJSHeapSize : null,
          jsHeapTotalBytes: mem ? mem.totalJSHeapSize : null,
          decodedImagesCount,
          decodedImagesTotalBytes,
          decodedParallaxCount,
          decodedParallaxBytes,
        };
      },
    };
  })();`;
}
