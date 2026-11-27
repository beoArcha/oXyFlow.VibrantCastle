#!/usr/bin/env bun
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { join, resolve } from "node:path";
import { chromium, type Browser } from "playwright-core";
import {
  buildInPagePerfInitScript,
  resolveChromiumExecutablePath,
  startStaticBuildServer,
  type InPagePerfProbeHandle,
  type InPagePerfSnapshot,
} from "./parallaxBrowserProbe";
import { evaluateParallaxBudgets, formatBudgetReport } from "./parallaxBudget";
import {
  aggregatePerfReport,
  bytesToMB,
  roundMetric,
  summarizeFrameDeltas,
  summarizeLongFrames,
  summarizeWorkDurations,
} from "./parallaxMetrics";
import {
  ALL_WORLD_LOCATION_IDS,
  DEFAULT_HOLD_RIGHT_MS,
  DEFAULT_JUMP_AT_MS,
  DEFAULT_PROFILES,
  DEFAULT_WARMUP_MS,
  PARALLAX_BUDGET_PROFILES,
  type MapDprMeasurement,
  type PerfEnvironmentInfo,
  type PerfReport,
  type PerfRunProfileConfig,
  type ProfileName,
  type ProfileSelection,
  type ServerMode,
} from "./parallaxTypes";

type PerfWindow = Window & { __vcParallaxPerf?: InPagePerfProbeHandle };

const ROOT_DIR = resolve(import.meta.dirname, "../..");
const OUT_DIR = join(ROOT_DIR, "scripts", "perf", "out");
const PERF_BUILD_DIR = join(OUT_DIR, "dist");
const DEFAULT_BASELINE_PATH = join(ROOT_DIR, "docs", "perf", "baseline.json");

export interface RunnerCliOptions {
  readonly serverMode: ServerMode;
  readonly url: string | null;
  readonly skipBuild: boolean;
  readonly profile: ProfileSelection;
  readonly strict: boolean;
  readonly writeBaseline: boolean;
  readonly outPath: string | null;
  readonly baselinePath: string;
  readonly holdRightMs: number;
  readonly jumpAtMs: number;
  readonly warmupMs: number;
  readonly dprsOverride: readonly number[] | null;
  readonly locations: readonly string[];
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback;
}

export function parseRunnerArgs(argv: readonly string[]): RunnerCliOptions {
  let serverMode: ServerMode = "build";
  let url: string | null = null;
  let skipBuild = false;
  let profile: ProfileSelection = "all";
  let strict = false;
  let writeBaseline = false;
  let outPath: string | null = null;
  let baselinePath = DEFAULT_BASELINE_PATH;
  let holdRightMs = DEFAULT_HOLD_RIGHT_MS;
  let jumpAtMs = DEFAULT_JUMP_AT_MS;
  let warmupMs = DEFAULT_WARMUP_MS;
  let dprsOverride: number[] | null = null;
  let locations: string[] = [...ALL_WORLD_LOCATION_IDS];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dev") serverMode = "dev";
    else if (arg === "--skip-build") skipBuild = true;
    else if (arg === "--strict") strict = true;
    else if (arg === "--write-baseline") writeBaseline = true;
    else if (arg === "--url" && argv[i + 1]) {
      serverMode = "external";
      url = argv[++i];
    } else if (arg === "--profile" && argv[i + 1]) {
      const next = argv[++i];
      if (next === "desktop" || next === "tablet" || next === "all") profile = next;
    } else if (arg === "--out" && argv[i + 1]) outPath = resolve(process.cwd(), argv[++i]);
    else if (arg === "--baseline" && argv[i + 1]) baselinePath = resolve(process.cwd(), argv[++i]);
    else if (arg === "--duration-ms" && argv[i + 1]) holdRightMs = parsePositiveInt(argv[++i], DEFAULT_HOLD_RIGHT_MS);
    else if (arg === "--jump-at-ms" && argv[i + 1]) jumpAtMs = parsePositiveInt(argv[++i], DEFAULT_JUMP_AT_MS);
    else if (arg === "--warmup-ms" && argv[i + 1]) warmupMs = parsePositiveInt(argv[++i], DEFAULT_WARMUP_MS);
    else if (arg === "--dprs" && argv[i + 1]) {
      const parsed = argv[++i].split(",").map((s) => Number(s.trim())).filter((n) => n === 1 || n === 2);
      if (parsed.length > 0) dprsOverride = parsed;
    } else if (arg === "--locations" && argv[i + 1]) {
      const parsed = argv[++i].split(",").map((s) => s.trim()).filter(Boolean);
      if (parsed.length > 0) locations = parsed;
    }
  }

  return {
    serverMode,
    url,
    skipBuild,
    profile,
    strict,
    writeBaseline,
    outPath,
    baselinePath,
    holdRightMs,
    jumpAtMs: Math.min(jumpAtMs, holdRightMs),
    warmupMs,
    dprsOverride,
    locations,
  };
}

function buildProductionClientIfNeeded(skipBuild: boolean): boolean {
  if (skipBuild && existsSync(join(PERF_BUILD_DIR, "index.html"))) return true;
  console.log("[perf:parallax] Building production client into scripts/perf/out/dist...");
  const result = spawnSync("bunx", ["vite", "build", "--base", "./", "--outDir", PERF_BUILD_DIR], {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production", VITE_BASE_PATH: "./" },
  });
  return result.status === 0 && existsSync(join(PERF_BUILD_DIR, "index.html"));
}

async function waitForHttpReady(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
    } catch {
      // Server still starting.
    }
    await new Promise((resolveSleep) => setTimeout(resolveSleep, 150));
  }
  return false;
}

async function startServerForMode(
  options: RunnerCliOptions
): Promise<{ baseUrl: string; stop: () => Promise<void> } | null> {
  if (options.serverMode === "external") {
    return { baseUrl: options.url ?? "", stop: async () => undefined };
  }
  if (options.serverMode === "build") {
    if (!buildProductionClientIfNeeded(options.skipBuild)) return null;
    return startStaticBuildServer(PERF_BUILD_DIR);
  }
  const port = 3199;
  const child: ChildProcess = spawn("bunx", ["vite", "--port", String(port), "--host", "127.0.0.1"], {
    cwd: ROOT_DIR,
    stdio: "pipe",
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  if (!(await waitForHttpReady(baseUrl, 20000))) {
    child.kill();
    return null;
  }
  return { baseUrl, stop: async () => { child.kill(); } };
}

async function measureLocationDprOnce(
  browser: Browser,
  baseUrl: string,
  profile: ProfileName,
  locationId: string,
  dpr: number,
  options: RunnerCliOptions
): Promise<{ measurement: MapDprMeasurement; userAgent: string }> {
  const budgetSpec = PARALLAX_BUDGET_PROFILES[profile];
  const context = await browser.newContext({
    viewport: budgetSpec.viewport,
    deviceScaleFactor: dpr,
  });

  try {
    const page = await context.newPage();
    await page.addInitScript(buildInPagePerfInitScript());

    // Apply CDP CPU throttling before navigation so map-entry decode hitches are throttled too.
    if (budgetSpec.cpuThrottlingRate > 1) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: budgetSpec.cpuThrottlingRate });
    }

    const sep = baseUrl.includes("?") ? "&" : "?";
    await page.goto(`${baseUrl}${sep}location=${encodeURIComponent(locationId)}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForSelector("#game-viewport-canvas", { timeout: 30000 });
    await page.waitForFunction(
      () => Boolean((window as PerfWindow).__vcParallaxPerf?.hasFirstParallaxFrame()),
      undefined,
      { timeout: 30000 }
    );

    if (options.warmupMs > 0) await page.waitForTimeout(options.warmupMs);

    await page.locator("#game-viewport-canvas").focus();
    await page.evaluate(() => (window as PerfWindow).__vcParallaxPerf?.startSampling());

    await page.keyboard.down("KeyD");
    if (options.jumpAtMs > 0) await page.waitForTimeout(options.jumpAtMs);
    await page.keyboard.down("Space");
    await page.waitForTimeout(120);
    await page.keyboard.up("Space");
    const remainingMs = Math.max(0, options.holdRightMs - options.jumpAtMs - 120);
    if (remainingMs > 0) await page.waitForTimeout(remainingMs);
    await page.keyboard.up("KeyD");

    const { snapshot, ua } = await page.evaluate((): { snapshot: InPagePerfSnapshot; ua: string } => {
      const probe = (window as PerfWindow).__vcParallaxPerf!;
      probe.stopSampling();
      return { snapshot: probe.getSnapshot(), ua: navigator.userAgent };
    });

    return {
      userAgent: ua,
      measurement: {
        profile,
        locationId,
        dpr,
        viewport: budgetSpec.viewport,
        cpuThrottlingRate: budgetSpec.cpuThrottlingRate,
        work: summarizeWorkDurations(snapshot.workDurationsMs, budgetSpec.frameBudgetMs),
        cadence: summarizeFrameDeltas(snapshot.deltasMs, budgetSpec.targetFrameMs, budgetSpec.droppedMultiplier),
        longFrames: summarizeLongFrames(
          snapshot.longFrameObserverType,
          snapshot.longFrameCount,
          snapshot.longFrameTotalBlockingTimeMs,
          snapshot.longFrameMaxDurationMs
        ),
        memory: {
          jsHeapUsedMB: snapshot.jsHeapUsedBytes === null ? null : bytesToMB(snapshot.jsHeapUsedBytes),
          jsHeapTotalMB: snapshot.jsHeapTotalBytes === null ? null : bytesToMB(snapshot.jsHeapTotalBytes),
          decodedImagesCount: snapshot.decodedImagesCount,
          decodedImagesTotalMB: bytesToMB(snapshot.decodedImagesTotalBytes),
          decodedParallaxCount: snapshot.decodedParallaxCount,
          decodedParallaxMB: bytesToMB(snapshot.decodedParallaxBytes),
        },
        timeToFirstParallaxFrameMs:
          snapshot.firstParallaxFrameMs === null ? null : roundMetric(snapshot.firstParallaxFrameMs, 2),
      },
    };
  } catch (err: unknown) {
    return {
      userAgent: "",
      measurement: {
        profile,
        locationId,
        dpr,
        viewport: budgetSpec.viewport,
        cpuThrottlingRate: budgetSpec.cpuThrottlingRate,
        work: summarizeWorkDurations([], budgetSpec.frameBudgetMs),
        cadence: summarizeFrameDeltas([], budgetSpec.targetFrameMs, budgetSpec.droppedMultiplier),
        longFrames: summarizeLongFrames("none", 0, 0, 0),
        memory: {
          jsHeapUsedMB: null,
          jsHeapTotalMB: null,
          decodedImagesCount: 0,
          decodedImagesTotalMB: 0,
          decodedParallaxCount: 0,
          decodedParallaxMB: 0,
        },
        timeToFirstParallaxFrameMs: null,
        error: err instanceof Error ? err.message : String(err),
      },
    };
  } finally {
    await context.close();
  }
}

async function measureLocationDpr(
  browser: Browser,
  baseUrl: string,
  profile: ProfileName,
  locationId: string,
  dpr: number,
  options: RunnerCliOptions
): Promise<{ measurement: MapDprMeasurement; userAgent: string }> {
  const first = await measureLocationDprOnce(browser, baseUrl, profile, locationId, dpr, options);
  if (!first.measurement.error) return first;

  console.warn(
    `[perf:parallax] Retrying [${profile}] ${locationId} @ DPR ${dpr} after transient failure: ${first.measurement.error}`
  );
  return measureLocationDprOnce(browser, baseUrl, profile, locationId, dpr, options);
}

function readExistingBaseline(path: string): PerfReport | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as PerfReport;
  } catch {
    return null;
  }
}

function resolveProfileConfigs(options: RunnerCliOptions): readonly PerfRunProfileConfig[] {
  const names: readonly ProfileName[] =
    options.profile === "all" ? DEFAULT_PROFILES : [options.profile];

  return names.map((name) => {
    const spec = PARALLAX_BUDGET_PROFILES[name];
    return {
      profile: name,
      viewport: spec.viewport,
      dprs: options.dprsOverride ?? spec.dprs,
      cpuThrottlingRate: spec.cpuThrottlingRate,
      targetHz: spec.targetHz,
      targetFrameMs: roundMetric(spec.targetFrameMs, 3),
      frameBudgetMs: spec.frameBudgetMs,
      droppedMultiplier: spec.droppedMultiplier,
    };
  });
}

async function main(): Promise<void> {
  const options = parseRunnerArgs(process.argv.slice(2));
  mkdirSync(OUT_DIR, { recursive: true });

  const serverHandle = await startServerForMode(options);
  if (!serverHandle) {
    console.error(`[perf:parallax] Failed to start server (${options.serverMode}).`);
    process.exit(1);
  }

  const executablePath = resolveChromiumExecutablePath();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  const profileConfigs = resolveProfileConfigs(options);
  const measurements: MapDprMeasurement[] = [];
  let userAgent = "";

  try {
    for (const profileCfg of profileConfigs) {
      for (const locationId of options.locations) {
        for (const dpr of profileCfg.dprs) {
          console.log(
            `[perf:parallax] Measuring [${profileCfg.profile}] ${locationId} @ DPR ${dpr} (CPU ${profileCfg.cpuThrottlingRate}x)...`
          );
          const result = await measureLocationDpr(
            browser,
            serverHandle.baseUrl,
            profileCfg.profile,
            locationId,
            dpr,
            options
          );
          if (!userAgent && result.userAgent) userAgent = result.userAgent;
          measurements.push(result.measurement);
        }
      }
    }
  } finally {
    await browser.close();
    await serverHandle.stop();
  }

  const cpus = os.cpus();
  const environment: PerfEnvironmentInfo = {
    machine: os.hostname(),
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: cpus[0]?.model ?? "unknown",
    cpuCores: cpus.length,
    browser: `Chromium ${browser.version()}`,
    userAgent,
    bunVersion: process.versions.bun ?? "unknown",
  };

  const report = aggregatePerfReport(measurements, environment, {
    serverMode: options.serverMode,
    holdRightMs: options.holdRightMs,
    jumpAtMs: options.jumpAtMs,
    warmupMs: options.warmupMs,
    profiles: profileConfigs,
    locations: options.locations,
  });

  const stamp = report.generatedAt.replace(/[:.]/g, "-");
  const timestampedPath = options.outPath ?? join(OUT_DIR, `parallax-${stamp}.json`);
  const serialized = JSON.stringify(report, null, 2) + "\n";

  writeFileSync(timestampedPath, serialized, "utf8");
  writeFileSync(join(OUT_DIR, "latest.json"), serialized, "utf8");
  console.log(`[perf:parallax] Report written to ${timestampedPath}`);

  if (options.writeBaseline) {
    mkdirSync(resolve(options.baselinePath, ".."), { recursive: true });
    writeFileSync(options.baselinePath, serialized, "utf8");
    console.log(`[perf:parallax] Baseline written to ${options.baselinePath}`);
  }

  const baseline = options.writeBaseline ? report : readExistingBaseline(options.baselinePath);
  const checkResult = evaluateParallaxBudgets(report, baseline, {
    profile: options.profile,
    strict: options.strict,
  });

  console.log("");
  console.log(formatBudgetReport(checkResult));
  process.exit(checkResult.exitCode);
}

if (import.meta.main) {
  void main();
}
