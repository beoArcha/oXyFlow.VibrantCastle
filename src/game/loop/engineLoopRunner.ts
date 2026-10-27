import { fpsManager, TargetFps } from "../engine/fpsManager";
import { debugManager } from "../debug/debugManager";
import { ILogger } from "@/lib/logger";

const MAX_STEPS_PER_FRAME = 8; // Guard against spiral of death

export interface IEngineLoopContext {
  getTargetFps(): TargetFps;
  onLoopStart(): void;
  onLoopStop(): void;
  fixedUpdate(stepMultiplier: number): void;
  renderFrame(alpha: number): void;
  executeProtected(operationName: string, action: () => void): boolean;
  notifyStateChanged(): void;
  logger: ILogger;
}

/**
 * Manages requestAnimationFrame scheduling, fixed timestep accumulation,
 * pause toggling, and decoupled frame rendering interpolation.
 */
export class EngineLoopRunner {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationId: number | null = null;

  constructor(private readonly context: IEngineLoopContext) {}

  public get running(): boolean {
    return this.isRunning;
  }

  public get paused(): boolean {
    return this.isPaused;
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.context.notifyStateChanged();
  }

  public togglePause(forceState?: boolean): boolean {
    this.isPaused = forceState !== undefined ? forceState : !this.isPaused;
    this.context.notifyStateChanged();
    return this.isPaused;
  }

  public start(): void {
    if (this.isRunning) return;

    this.context.logger.info("Starting GameEngine loop");
    this.isRunning = true;

    fpsManager.setTargetFps(this.context.getTargetFps());
    fpsManager.reset();

    this.context.onLoopStart();

    let lastTimestamp = 0;

    const loop = (timestamp: number) => {
      if (!this.isRunning) return;

      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
      }
      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      this.processFrame(elapsed);

      fpsManager.recordFrameRender(timestamp);
      if (typeof requestAnimationFrame !== "undefined") {
        this.animationId = requestAnimationFrame(loop);
      }
    };

    if (typeof requestAnimationFrame !== "undefined") {
      this.animationId = requestAnimationFrame(loop);
    }
  }

  public stop(): void {
    this.context.logger.info("Stopping GameEngine loop");
    this.isRunning = false;

    if (this.animationId) {
      if (typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(this.animationId);
      }
      this.animationId = null;
    }

    this.context.onLoopStop();
  }

  public tick(dtMultiplier: number = 1.0): void {
    if (this.isPaused) {
      this.context.renderFrame(1.0);
      return;
    }
    this.context.fixedUpdate(dtMultiplier);
    this.context.renderFrame(1.0);
  }

  public stepSingleFrame(): void {
    const wasPaused = this.isPaused;
    this.isPaused = false;
    this.tick(1.0);
    this.isPaused = wasPaused;
    this.context.notifyStateChanged();
  }

  private processFrame(elapsed: number): void {
    if (this.isPaused) {
      this.context.executeProtected("renderFrame (paused)", () => this.context.renderFrame(1.0));
      return;
    }

    fpsManager.pushDelta(elapsed);
    const timeScale = debugManager.state.timeScale || 1.0;
    const stepMultiplier = fpsManager.getStepMultiplier() * timeScale;

    let updateSteps = 0;
    while (fpsManager.consumeFixedStep() && updateSteps < MAX_STEPS_PER_FRAME) {
      const success = this.context.executeProtected("fixedUpdate", () =>
        this.context.fixedUpdate(stepMultiplier)
      );
      if (!success) {
        break;
      }
      updateSteps++;
    }

    const alpha = fpsManager.getInterpolationAlpha();
    this.context.executeProtected("renderFrame", () => this.context.renderFrame(alpha));
  }
}
