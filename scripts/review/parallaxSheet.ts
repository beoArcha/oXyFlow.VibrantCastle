/**
 * One-command visual review of the parallax backgrounds.
 *
 * Starts the Vite dev server on a free port, opens every map through the
 * dev-only `?vcReview` hook, captures screenshots per viewport and camera
 * position, records a 3 s hold-right clip on desktop, and writes the gallery
 * to dist-review/index.html.
 *
 * Usage: bun run review:parallax
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium, type Browser, type Page } from "playwright-core";
import type { ParallaxReviewHandle } from "../../src/app/reviewHook";
import type { LocationId } from "../../src/game/locations/types";
import { resolveChromiumExecutable } from "./reviewBrowser";
import {
  REVIEW_GALLERY_FILE,
  REVIEW_OUT_DIR,
  REVIEW_POSITIONS,
  REVIEW_VIEWPORTS,
  buildGalleryGrid,
  renderGalleryHtml,
  reviewClipPath,
  reviewShotPath,
  type ReviewViewport,
} from "./reviewGallery";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const HOLD_RIGHT_MS = 3000;
const SETTLE_MS = 1500;
const LOAD_TIMEOUT_MS = 120_000;

interface ReviewWindow {
  __vcReview?: ParallaxReviewHandle;
}

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createNetServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolve(port));
    });
  });
}

function readCommitSha(): string {
  try {
    const sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return sha || "unknown";
  } catch {
    return "unknown";
  }
}

/** Opens the game on a fresh page and waits until the engine loop is running. */
async function openGame(page: Page, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/?vcReview=1`, { waitUntil: "load", timeout: LOAD_TIMEOUT_MS });
  await page.waitForFunction(
    () => Boolean((window as unknown as ReviewWindow).__vcReview?.engine.isRunning),
    undefined,
    { timeout: LOAD_TIMEOUT_MS },
  );
}

async function loadMap(page: Page, mapId: LocationId): Promise<void> {
  await page.evaluate((id: LocationId) => {
    const handle = (window as unknown as ReviewWindow).__vcReview;
    if (!handle) return;
    handle.engine.setPaused(false);
    handle.engine.loadLocation(id, undefined, false);
  }, mapId);
  await page.waitForFunction(
    (id: LocationId) =>
      (window as unknown as ReviewWindow).__vcReview?.engine.currentLocationId === id,
    mapId,
    { timeout: LOAD_TIMEOUT_MS },
  );
  await page.waitForTimeout(SETTLE_MS);
}

async function shoot(page: Page, outDir: string, mapId: string, viewport: ReviewViewport, position: string): Promise<void> {
  const target = join(outDir, reviewShotPath(mapId, viewport.id, position));
  await mkdir(join(target, ".."), { recursive: true });
  await page.screenshot({ path: target, animations: "disabled" });
}

async function captureViewport(
  browser: Browser,
  baseUrl: string,
  outDir: string,
  mapId: LocationId,
  viewport: ReviewViewport,
): Promise<void> {
  const isDesktop = viewport.id === "desktop";
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    recordVideo: isDesktop
      ? { dir: join(outDir, ".video-tmp"), size: { width: viewport.width, height: viewport.height } }
      : undefined,
  });
  const page = await context.newPage();
  try {
    await openGame(page, baseUrl);
    await loadMap(page, mapId);
    await shoot(page, outDir, mapId, viewport, "start");

    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(HOLD_RIGHT_MS);
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(SETTLE_MS);
    await shoot(page, outDir, mapId, viewport, "middle");

    await page.evaluate(() => (window as unknown as ReviewWindow).__vcReview?.moveNearGoal());
    await page.waitForTimeout(SETTLE_MS);
    await shoot(page, outDir, mapId, viewport, "goal");
  } finally {
    const video = isDesktop ? page.video() : null;
    await context.close();
    if (video) await video.saveAs(join(outDir, reviewClipPath(mapId)));
  }
}

async function main(): Promise<number> {
  const executablePath = resolveChromiumExecutable({
    env: process.env,
    platform: process.platform,
    homeDir: homedir(),
  });
  if (executablePath && !existsSync(executablePath)) {
    console.error(`Chromium not found at ${executablePath}. Set PLAYWRIGHT_CHROMIUM_PATH or run playwright install chromium.`);
    return 1;
  }

  const outDir = join(REPO_ROOT, REVIEW_OUT_DIR);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  const port = await freePort();
  const server = await createServer({
    root: REPO_ROOT,
    logLevel: "warn",
    server: { host: "127.0.0.1", port, strictPort: true },
  });
  await server.listen();
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true, executablePath });

  let exitCode = 0;
  try {
    const bootstrap = await browser.newPage();
    await openGame(bootstrap, baseUrl);
    const mapIds = await bootstrap.evaluate(
      () => [...((window as unknown as ReviewWindow).__vcReview?.locationIds ?? [])],
    );
    await bootstrap.close();

    for (const mapId of mapIds) {
      for (const viewport of REVIEW_VIEWPORTS) {
        console.log(`capture ${mapId} ${viewport.id}`);
        try {
          await captureViewport(browser, baseUrl, outDir, mapId, viewport);
        } catch (error) {
          exitCode = 1;
          console.error(`failed ${mapId} ${viewport.id}:`, error);
        }
      }
    }

    const grid = buildGalleryGrid(mapIds);
    const html = renderGalleryHtml(grid, {
      commitSha: readCommitSha(),
      generatedAt: new Date().toISOString(),
    });
    await writeFile(join(outDir, REVIEW_GALLERY_FILE), html, "utf8");
    await rm(join(outDir, ".video-tmp"), { recursive: true, force: true });
    console.log(`gallery: ${join(outDir, REVIEW_GALLERY_FILE)}`);
    console.log(`positions: ${REVIEW_POSITIONS.map((p) => p.id).join(", ")}`);
  } finally {
    await browser.close();
    await server.close();
  }
  return exitCode;
}

if (import.meta.main) {
  process.exitCode = await main();
}
