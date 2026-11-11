import { describe, it, expect } from "bun:test";
import { GamePhysicsEngine } from "../physics";
import { createMockEnemy } from "@test-utils/mockEntities";

describe("Enemy animation state machine", () => {
  const physics = new GamePhysicsEngine();

  it("is idle for stationary ground enemies and dummies", () => {
    const stationary = createMockEnemy({ vx: 0 });
    const dummy = createMockEnemy({ isDummy: true, vx: 2 });

    physics.updateEnemy(stationary, 1);
    physics.updateEnemy(dummy, 1);

    expect(stationary.animationState).toBe("idle");
    expect(dummy.animationState).toBe("idle");
  });

  it("is move while patrolling", () => {
    const enemy = createMockEnemy({ vx: 2, x: 200 });

    physics.updateEnemy(enemy, 1);

    expect(enemy.animationState).toBe("move");
  });

  it("is fly for aerial enemies", () => {
    const enemy = createMockEnemy({ vx: 2, isAerial: true });

    physics.updateEnemy(enemy, 1);

    expect(enemy.animationState).toBe("fly");
  });

  it("is hit while damageTimer is positive, then returns to base state", () => {
    const enemy = createMockEnemy({ vx: 2, damageTimer: 2, isAerial: true });

    physics.updateEnemy(enemy, 1);
    const during = enemy.animationState;
    physics.updateEnemy(enemy, 1);

    expect(during).toBe("hit");
    expect(enemy.animationState).toBe("fly");
  });

  it("resets the clock when the state changes and advances it otherwise", () => {
    const enemy = createMockEnemy({ vx: 2, x: 200 });

    physics.updateEnemy(enemy, 1);
    physics.updateEnemy(enemy, 1);
    physics.updateEnemy(enemy, 1);
    const moveTicks = enemy.animationTicks;
    enemy.damageTimer = 5;
    physics.updateEnemy(enemy, 1);

    expect(moveTicks).toBe(2);
    expect(enemy.animationState).toBe("hit");
    expect(enemy.animationTicks).toBe(0);
  });

  it("advances 60 clock units per simulated second at 30, 60 and 120 Hz", () => {
    const results = [30, 60, 120].map((hz) => {
      const enemy = createMockEnemy({ vx: 0 });
      physics.updateEnemy(enemy, 60 / hz);
      for (let i = 0; i < hz; i++) physics.updateEnemy(enemy, 60 / hz);
      return enemy.animationTicks;
    });

    expect(results).toEqual([60, 60, 60]);
  });

  it("does not touch dead enemies", () => {
    const enemy = createMockEnemy({ isDead: true });

    physics.updateEnemy(enemy, 1);

    expect(enemy.animationState).toBeUndefined();
  });
});
