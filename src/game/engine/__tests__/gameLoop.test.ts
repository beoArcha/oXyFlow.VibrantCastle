import { describe, it, expect, beforeEach } from "bun:test";
import { FPSManager, TargetFps } from "../fpsManager";
import { GameEngine } from "../../loop/engine";

describe("Game Loop & 15-FPS Quantum Framerate Architecture", () => {
  let fps: FPSManager;

  beforeEach(() => {
    fps = new FPSManager(60);
  });

  describe("15-FPS quantum multiples & physics normalization", () => {
    it("supports only framerates that are multiples of 15 (30, 60, 90, 120 Hz)", () => {
      expect(FPSManager.SUPPORTED_FPS).toEqual([30, 60, 90, 120]);
      expect(FPSManager.BASE_QUANTUM).toBe(15);

      for (const target of FPSManager.SUPPORTED_FPS) {
        expect(target % 15).toBe(0);
      }
    });

    it("correctly computes 15-step quantum multiples for all supported framerates", () => {
      expect(fps.get15Steps(30)).toBe(2);
      expect(fps.get15Steps(60)).toBe(4);
      expect(fps.get15Steps(90)).toBe(6);
      expect(fps.get15Steps(120)).toBe(8);
    });

    it("calculates accurate fixed step durations in milliseconds", () => {
      expect(fps.getFixedStepMs(30)).toBeCloseTo(33.333, 2);
      expect(fps.getFixedStepMs(60)).toBeCloseTo(16.666, 2);
      expect(fps.getFixedStepMs(90)).toBeCloseTo(11.111, 2);
      expect(fps.getFixedStepMs(120)).toBeCloseTo(8.333, 2);
    });

    it("normalizes delta multipliers relative to 60 FPS standard baseline", () => {
      // 30 FPS = 2.0x step delta (covers 2x 60Hz delta per step)
      expect(fps.getDtMultiplier(30)).toBe(2.0);
      // 60 FPS = 1.0x baseline standard
      expect(fps.getDtMultiplier(60)).toBe(1.0);
      // 90 FPS = 2/3 ≈ 0.6667x
      expect(fps.getDtMultiplier(90)).toBeCloseTo(0.6667, 3);
      // 120 FPS = 0.5x
      expect(fps.getDtMultiplier(120)).toBe(0.5);
    });

    it("guarantees identical physical travel distance over 1 real-world second across all FPS", () => {
      const baseVelocity = 4.8; // player run speed px/frame at 60Hz

      for (const target of [30, 60, 90, 120] as TargetFps[]) {
        const stepMultiplier = fps.getDtMultiplier(target);
        const distancePerStep = baseVelocity * stepMultiplier;
        const totalDistanceInOneSecond = distancePerStep * target;

        // In 1 second, the player must travel exactly 288 pixels at any framerate
        expect(totalDistanceInOneSecond).toBeCloseTo(baseVelocity * 60, 2);
      }
    });
  });

  describe("Fixed timestep accumulator & interpolation", () => {
    it("accumulates elapsed time and consumes discrete fixed steps", () => {
      fps.setTargetFps(60); // 16.666 ms per step
      fps.pushDelta(16.67);

      expect(fps.consumeFixedStep()).toBe(true);
      expect(fps.consumeFixedStep()).toBe(false); // only 1 step accumulated
    });

    it("consumes multiple steps on lag spikes", () => {
      fps.setTargetFps(60); // 16.666 ms per step
      fps.pushDelta(3 * fps.getFixedStepMs() + 1); // exactly 3 full steps accumulated

      let steps = 0;
      while (fps.consumeFixedStep()) {
        steps++;
      }
      expect(steps).toBe(3);
    });

    it("prevents spiral of death by clamping maximum accumulated time", () => {
      fps.setTargetFps(60);
      // Simulate tab being inactive for 5 seconds (5000 ms)
      fps.pushDelta(5000);

      expect(fps.getAccumulator()).toBeLessThanOrEqual(FPSManager.MAX_ACCUMULATOR_MS);
      expect(fps.getAccumulator()).toBe(250);
    });

    it("calculates smooth normalized interpolation alpha in [0.0, 1.0]", () => {
      fps.setTargetFps(60); // 16.666 ms
      fps.pushDelta(8.333); // half a step

      const alpha = fps.getInterpolationAlpha();
      expect(alpha).toBeGreaterThanOrEqual(0.49);
      expect(alpha).toBeLessThanOrEqual(0.51);
    });
  });

  describe("GameEngine decoupled simulation & rendering", () => {
    it("can run fixedUpdate independently without canvas attached", () => {
      const engine = new GameEngine();
      const p1 = engine.players[0];
      const initialY = p1.y;

      // Execute 3 discrete physics steps with gravity
      engine.fixedUpdate(1.0);
      engine.fixedUpdate(1.0);
      engine.fixedUpdate(1.0);

      // Player should fall under gravity (or change velocity)
      expect(p1.vy).toBeGreaterThan(0);
      expect(p1.y).toBeGreaterThan(initialY);
    });

    it("executes renderFrame without mutating player physics state", () => {
      const engine = new GameEngine();
      const p1 = engine.players[0];
      const stateBefore = { x: p1.x, y: p1.y, vx: p1.vx, vy: p1.vy };

      // Render frame should never alter kinematic state
      engine.renderFrame(0.5);

      expect(p1.x).toBe(stateBefore.x);
      expect(p1.y).toBe(stateBefore.y);
      expect(p1.vx).toBe(stateBefore.vx);
      expect(p1.vy).toBe(stateBefore.vy);
    });

    it("freezes physics in isPaused mode while allowing renderFrame", () => {
      const engine = new GameEngine();
      engine.setPaused(true);
      const p1 = engine.players[0];
      const initialY = p1.y;

      engine.tick(1.0); // In pause mode, tick only renders

      expect(p1.y).toBe(initialY);
      expect(p1.vy).toBe(0);
    });

    it("advances simulation by exactly 1 step via stepSingleFrame debug action", () => {
      const engine = new GameEngine();
      engine.setPaused(true);
      const p1 = engine.players[0];
      const initialY = p1.y;

      engine.stepSingleFrame();

      // Exactly 1 step was processed despite being paused
      expect(p1.vy).toBeGreaterThan(0);
      expect(p1.y).toBeGreaterThan(initialY);
      expect(engine.isPaused).toBe(true);
    });
  });
});
