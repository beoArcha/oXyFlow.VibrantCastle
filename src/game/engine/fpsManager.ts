export type TargetFps = 30 | 60 | 90 | 120;

/**
 * FPS Management and Physics Normalization System.
 * 
 * Based on 15-FPS quantum multiples:
 * - 30 FPS = 2 * 15 (steps = 2)  => Multiplier = 4 / 2 = 2.00x
 * - 60 FPS = 4 * 15 (steps = 4)  => Multiplier = 4 / 4 = 1.00x (Baseline standard)
 * - 90 FPS = 6 * 15 (steps = 6)  => Multiplier = 4 / 6 = 0.6667x
 * - 120 FPS = 8 * 15 (steps = 8) => Multiplier = 4 / 8 = 0.50x
 * 
 * Guarantees that physics, movement, animations, and gameplay progress at the exact same
 * real-world speed across 30, 60, 90, and 120 FPS.
 */
export class FPSManager {
  public static readonly BASE_QUANTUM = 15;
  public static readonly BASELINE_FPS = 60;
  public static readonly BASELINE_STEPS = 60 / 15; // 4 steps

  public static readonly SUPPORTED_FPS: readonly TargetFps[] = [30, 60, 90, 120];
  public static readonly MAX_ACCUMULATOR_MS = 250; // Guard against spiral of death after background tab pause

  private targetFps: TargetFps = 60;
  private lastFrameTimestamp: number = 0;
  private accumulator: number = 0;

  // Real-time FPS measurement
  private measuredFps: number = 60;
  private frameCountInWindow: number = 0;
  private lastFpsWindowTime: number = 0;

  constructor(initialFps: TargetFps = 60) {
    this.setTargetFps(initialFps);
  }

  public setTargetFps(fps: TargetFps) {
    if (FPSManager.SUPPORTED_FPS.includes(fps)) {
      this.targetFps = fps;
      this.accumulator = 0;
    }
  }

  public getTargetFps(): TargetFps {
    return this.targetFps;
  }

  /**
   * Returns the multiple of 15 for the given or current target FPS.
   * 30 -> 2
   * 60 -> 4
   * 90 -> 6
   * 120 -> 8
   */
  public get15Steps(fps: TargetFps = this.targetFps): number {
    return Math.round(fps / FPSManager.BASE_QUANTUM);
  }

  /**
   * Calculates the physics/movement delta multiplier relative to the 60 FPS standard baseline.
   * Multiplier formula: BASELINE_STEPS / steps(targetFps) = 4 / (targetFps / 15) = 60 / targetFps.
   * 
   * - At 30 FPS: dtMultiplier = 2.0 (covers 2x 60Hz delta per frame => identical speed)
   * - At 60 FPS: dtMultiplier = 1.0 (baseline standard)
   * - At 90 FPS: dtMultiplier = 2/3 ≈ 0.6667 (covers 2/3 delta per frame)
   * - At 120 FPS: dtMultiplier = 0.5 (covers 0.5 delta per frame)
   */
  public getDtMultiplier(fps: TargetFps = this.targetFps): number {
    const steps = this.get15Steps(fps);
    return FPSManager.BASELINE_STEPS / steps;
  }

  /**
   * Expected duration of a single simulation step in milliseconds.
   */
  public getFixedStepMs(fps: TargetFps = this.targetFps): number {
    return 1000 / fps;
  }

  /**
   * Delta multiplier for the current target framerate fixed step.
   */
  public getStepMultiplier(): number {
    return this.getDtMultiplier(this.targetFps);
  }

  /**
   * Pushes elapsed real time into the accumulator with spiral-of-death guard.
   */
  public pushDelta(deltaMs: number): number {
    const safeDelta = Math.max(0, Math.min(deltaMs, FPSManager.MAX_ACCUMULATOR_MS));
    this.accumulator = Math.min(this.accumulator + safeDelta, FPSManager.MAX_ACCUMULATOR_MS);
    return this.accumulator;
  }

  /**
   * Consumes a single fixed step if enough time has accumulated.
   */
  public consumeFixedStep(): boolean {
    const stepMs = this.getFixedStepMs();
    if (this.accumulator >= stepMs) {
      this.accumulator -= stepMs;
      return true;
    }
    return false;
  }

  /**
   * Returns current interpolation factor alpha in [0.0, 1.0] for decoupled rendering.
   */
  public getInterpolationAlpha(): number {
    const stepMs = this.getFixedStepMs();
    if (stepMs <= 0) return 1.0;
    return Math.max(0.0, Math.min(1.0, this.accumulator / stepMs));
  }

  /**
   * Expected duration of a single frame in milliseconds (backward compatibility).
   */
  public getTargetFrameIntervalMs(fps: TargetFps = this.targetFps): number {
    return this.getFixedStepMs(fps);
  }

  /**
   * Records a rendered frame timestamp and updates measured FPS telemetry.
   */
  public recordFrameRender(timestamp: number) {
    if (this.lastFpsWindowTime === 0) {
      this.lastFpsWindowTime = timestamp;
      this.frameCountInWindow = 1;
      return;
    }
    this.frameCountInWindow++;
    const timeSinceWindow = timestamp - this.lastFpsWindowTime;
    if (timeSinceWindow >= 500) {
      this.measuredFps = Math.round((this.frameCountInWindow * 1000) / timeSinceWindow);
      this.frameCountInWindow = 0;
      this.lastFpsWindowTime = timestamp;
    }
  }

  /**
   * Determines if a game tick should execute at the current timestamp,
   * providing precise throttling to target FPS.
   */
  public shouldExecuteFrame(timestamp: number): boolean {
    if (this.lastFrameTimestamp === 0) {
      this.lastFrameTimestamp = timestamp;
      this.lastFpsWindowTime = timestamp;
      this.frameCountInWindow = 1;
      return true;
    }

    const interval = this.getTargetFrameIntervalMs();
    const elapsed = timestamp - this.lastFrameTimestamp;

    // 1.5ms tolerance to prevent vsync stutter
    if (elapsed >= interval - 1.5) {
      // Adjust last frame timestamp, avoiding long spiral-of-death delays if tab was inactive
      if (elapsed > interval * 4) {
        this.lastFrameTimestamp = timestamp;
      } else {
        this.lastFrameTimestamp += interval;
        // Keep within reasonable bounds of current timestamp
        if (this.lastFrameTimestamp < timestamp - interval) {
          this.lastFrameTimestamp = timestamp;
        }
      }

      this.recordFrameRender(timestamp);
      return true;
    }

    return false;
  }

  /**
   * Returns current measured frames per second.
   */
  public getMeasuredFps(): number {
    return this.measuredFps;
  }

  public getAccumulator(): number {
    return this.accumulator;
  }

  public reset() {
    this.lastFrameTimestamp = 0;
    this.accumulator = 0;
    this.frameCountInWindow = 0;
    this.lastFpsWindowTime = 0;
  }
}

export const fpsManager = new FPSManager(60);
export default fpsManager;
