import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize, resolve } from "node:path";

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

/**
 * Resolves the Chromium executable path from PLAYWRIGHT_CHROMIUM_PATH,
 * falling back to the local Windows ms-playwright binary when present,
 * or undefined to let playwright-core choose its default browser (e.g. Linux CI).
 */
export function resolveChromiumExecutablePath(
  env: Record<string, string | undefined> = process.env
): string | undefined {
  const configured = env.PLAYWRIGHT_CHROMIUM_PATH?.trim();
  if (configured) return configured;

  if (env.LOCALAPPDATA) {
    const localWinChrome = join(
      env.LOCALAPPDATA,
      "ms-playwright",
      "chromium-1248",
      "chrome-win64",
      "chrome.exe"
    );
    if (existsSync(localWinChrome)) return localWinChrome;
  }

  return undefined;
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
  readonly deltasMs: readonly number[];
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
 * Captures time-to-first-parallax-frame, rAF frame deltas, and decoded image byte totals
 * without modifying rendering source files.
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

    let sampling = false;
    let rafId = 0;
    let lastTs = 0;
    let deltasMs = [];

    function onFrame(now) {
      if (!sampling) return;
      if (lastTs > 0) {
        deltasMs.push(now - lastTs);
      }
      lastTs = now;
      rafId = requestAnimationFrame(onFrame);
    }

    window.__vcParallaxPerf = {
      hasFirstParallaxFrame() {
        return firstParallaxFrameMs !== null;
      },
      startSampling() {
        deltasMs = [];
        lastTs = 0;
        sampling = true;
        rafId = requestAnimationFrame(onFrame);
      },
      stopSampling() {
        sampling = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
      },
      getSnapshot() {
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
          deltasMs: deltasMs.slice(),
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
