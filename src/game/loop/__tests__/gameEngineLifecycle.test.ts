import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "../engine";
import { LoopCircuitBreaker } from "../loopCircuitBreaker";
import { SoundType, PlayerId } from "@/game/types";
import { createMockCanvas } from "@test-utils/mockCanvas";

import { debugManager } from "../../debug/debugManager";

describe("GameEngine Lifecycle, Transitions & State Management", () => {
  let engine: GameEngine;
  let originalRaf: any;
  let originalCaf: any;
  let rafCallbacks: ((timestamp: number) => void)[];

  beforeEach(() => {
    rafCallbacks = [];
    originalRaf = globalThis.requestAnimationFrame;
    originalCaf = globalThis.cancelAnimationFrame;

    (globalThis as any).requestAnimationFrame = (cb: (timestamp: number) => void) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    };
    (globalThis as any).cancelAnimationFrame = () => { };

    engine = new GameEngine();
  });

  afterEach(() => {
    engine.stop();
    (globalThis as any).requestAnimationFrame = originalRaf;
    (globalThis as any).cancelAnimationFrame = originalCaf;
  });

  describe("Lifecycle state transitions (start, pause, resume, stop)", () => {
    it("starts the game engine and initiates loop", () => {
      expect((engine as any).isRunning).toBe(false);

      engine.start();
      expect((engine as any).isRunning).toBe(true);

      // Subsequent start() call is a no-op
      engine.start();
      expect((engine as any).isRunning).toBe(true);
    });

    it("stops the game engine cleanly", () => {
      engine.start();
      expect((engine as any).isRunning).toBe(true);

      engine.stop();
      expect((engine as any).isRunning).toBe(false);
    });

    it("pauses and resumes simulation via setPaused", () => {
      let notified = 0;
      engine.registerStateListener(() => {
        notified++;
      });

      engine.setPaused(true);
      expect(engine.isPaused).toBe(true);
      expect(notified).toBe(1);

      engine.setPaused(false);
      expect(engine.isPaused).toBe(false);
      expect(notified).toBe(2);
    });

    it("toggles pause state with togglePause()", () => {
      expect(engine.isPaused).toBe(false);

      const paused = engine.togglePause();
      expect(paused).toBe(true);
      expect(engine.isPaused).toBe(true);

      const unpaused = engine.togglePause();
      expect(unpaused).toBe(false);
      expect(engine.isPaused).toBe(false);

      // Force state
      engine.togglePause(true);
      expect(engine.isPaused).toBe(true);
    });

    it("steps single frame when paused with stepSingleFrame", () => {
      engine.setPaused(true);
      const initialTicks = engine.simulationTicks;

      engine.stepSingleFrame();

      expect(engine.simulationTicks).toBeGreaterThan(initialTicks);
      expect(engine.isPaused).toBe(true); // restored paused state
    });
  });

  describe("Level and location lifecycle", () => {
    it("delegates level properties through facade getters and setters", () => {
      expect(engine.currentLocationId).toBe("courtyard");
      expect(engine.levelWidth).toBeGreaterThan(0);
      expect(engine.levelHeight).toBeGreaterThan(0);
      expect(engine.spawnPoint).toBeDefined();

      engine.levelWidth = 3000;
      expect(engine.levelWidth).toBe(3000);

      engine.levelHeight = 800;
      expect(engine.levelHeight).toBe(800);

      engine.isVictory = true;
      expect(engine.isVictory).toBe(true);

      engine.isDefeat = true;
      expect(engine.isDefeat).toBe(true);

      engine.portalCooldownTimer = 15;
      expect(engine.portalCooldownTimer).toBe(15);
    });

    it("loads new location while preserving player progression", () => {
      const p1 = engine.players[0];
      p1.health = 75;
      p1.mana = 40;

      engine.loadLocation("grand_hall");

      expect(engine.currentLocationId).toBe("grand_hall");
      expect(engine.players[0].health).toBe(75);
      expect(engine.players[0].mana).toBe(40);
    });

    it("resets level cleanly with resetLevel", () => {
      engine.isVictory = true;
      engine.isDefeat = true;

      engine.resetLevel("courtyard");

      expect(engine.isVictory).toBe(false);
      expect(engine.isDefeat).toBe(false);
      expect(engine.currentLocationId).toBe("courtyard");
    });

    it("advances to next sequential location", () => {
      engine.loadLocation("courtyard");
      engine.advanceToNextLocation();
      expect(engine.currentLocationId).toBe("thorn_chasm");
    });
  });

  describe("Settings, audio, and display configuration", () => {
    it("updates language and narration system", () => {
      let notified = false;
      engine.registerStateListener(() => {
        notified = true;
      });

      engine.setLanguage("en");
      expect(engine.settings.language).toBe("en");
      expect(notified).toBe(true);
    });

    it("configures target framerate and fps counter display", () => {
      engine.setTargetFps(120);
      expect(engine.settings.display.targetFps).toBe(120);

      engine.setShowFpsCounter(true);
      expect(engine.settings.display.showFpsCounter).toBe(true);
    });

    it("configures two-player mode", () => {
      engine.setTwoPlayerMode(true);
      expect(engine.settings.isTwoPlayer).toBe(true);
      expect(engine.players.length).toBe(2);

      engine.setTwoPlayerMode(false);
      expect(engine.settings.isTwoPlayer).toBe(false);
    });

    it("attaches canvas renderer and configures hardware acceleration", () => {
      const { canvas } = createMockCanvas(1280, 720);
      engine.attachCanvas(canvas);

      expect(engine.getRenderer()).toBeDefined();

      engine.setHardwareAcceleration(false);
      expect(engine.settings.display.hardwareAcceleration).toBe(false);

      engine.setCanvasDimensions(1920, 1080, 2, "pixel");
    });

    it("delegates audio sfx and music intensity", () => {
      engine.setMusicIntensity(0.8);
      engine.playSFX(SoundType.SFX_SLASH);
    });
  });

  describe("State listeners & reactivity", () => {
    it("subscribes and cleanly unsubscribes state listeners", () => {
      let callCount = 0;
      const unsubscribe = engine.registerStateListener(() => {
        callCount++;
      });

      engine.notifyReact();
      expect(callCount).toBe(1);

      unsubscribe();
      engine.notifyReact();
      expect(callCount).toBe(1); // not called again
    });

    it("isolates errors thrown in state listeners without crashing", () => {
      engine.registerStateListener(() => {
        throw new Error("UI crashed");
      });

      // Should not throw
      expect(() => engine.notifyReact()).not.toThrow();
    });
  });

  describe("Pit death & screen boundary clamping in fixedUpdate", () => {
    it("clamps player horizontal position to level boundaries", () => {
      const p1 = engine.players[0];
      p1.x = -50;
      engine.fixedUpdate(1.0);
      expect(p1.x).toBe(0);

      p1.x = 99999;
      engine.fixedUpdate(1.0);
      expect(p1.x).toBe(engine.levelWidth - p1.width);
    });

    it("triggers defeat when player falls into bottomless pit", () => {
      const p1 = engine.players[0];
      p1.y = engine.levelHeight + 150; // below pit threshold

      engine.fixedUpdate(1.0);

      expect(p1.health).toBe(0);
      expect(p1.isDead).toBe(true);
      expect(engine.isDefeat).toBe(true);
    });
  });

  describe("LoopCircuitBreaker integration on lag / freeze", () => {
    it("pauses the engine when circuit breaker trips", () => {
      let tripped = false;
      const customBreaker = new LoopCircuitBreaker({
        maxConsecutiveErrors: 1,
        logger: (engine as any).logger,
        onTrip: () => {
          tripped = true;
          engine.setPaused(true);
        },
      });

      // Inject custom breaker
      (engine as any).circuitBreaker = customBreaker;

      // Simulate loop operation causing error to trip the breaker
      customBreaker.execute("faultyOperation", () => {
        throw new Error("Simulated freeze");
      });

      expect(tripped).toBe(true);
      expect(engine.isPaused).toBe(true);
    });
  });

  describe("Save and Load facade methods", () => {
    it("executes saveGame and notifies state listeners", () => {
      let notified = false;
      engine.registerStateListener(() => {
        notified = true;
      });

      engine.saveGame();
      expect(notified).toBe(true);
    });

    it("loads game successfully from valid save state", () => {
      const mockSaveState: any = {
        levelId: "courtyard",
        p1Health: 90,
        p1MaxHealth: 100,
        p1Mana: 50,
        p1MaxMana: 50,
        p1Stamina: 100,
        p1MaxStamina: 100,
        p1X: 150,
        p1Y: 200,
        p2Health: 80,
        p2MaxHealth: 100,
        p2Mana: 40,
        p2MaxMana: 40,
        p2Stamina: 80,
        p2MaxStamina: 80,
        p2X: 200,
        p2Y: 200,
        enemies: [],
        entities: [],
      };

      engine.loadGame(mockSaveState);
      expect(engine.settings.isTwoPlayer).toBe(true);
      expect(engine.players[0].health).toBe(90);
    });
  });

  describe("RAF game loop ticks", () => {
    it("runs loop ticks through requestAnimationFrame callbacks", () => {
      engine.start();

      expect(rafCallbacks.length).toBeGreaterThan(0);
      const initialTicks = engine.simulationTicks;

      // Invoke loop callback with advancing timestamps (>16.6ms step)
      const firstCb = rafCallbacks[rafCallbacks.length - 1];
      firstCb(1000);
      const nextCb = rafCallbacks[rafCallbacks.length - 1];
      nextCb(1040); // 40ms elapsed > fixedStep

      expect(engine.simulationTicks).toBeGreaterThan(initialTicks);
    });
  });

  describe("God mode pit rescue", () => {
    it("rescues player to spawn point when in god mode and falling in pit", () => {
      debugManager.state.godMode = true;

      const p1 = engine.players[0];
      p1.y = engine.levelHeight + 150;

      engine.fixedUpdate(1.0);

      expect(p1.x).toBe(engine.spawnPoint.x);
      expect(p1.y).toBe(engine.spawnPoint.y);
      expect(p1.isDead).toBe(false);

      debugManager.state.godMode = false;
    });
  });

  describe("Facade command and cheat delegations", () => {
    it("delegates cheats and player commands smoothly", () => {
      expect(engine.getRendererScaleFactor()).toBe(1);

      engine.teleportPlayer(PlayerId.Player1, 300, 200);
      expect(engine.players[0].x).toBe(300);

      engine.refillVitals(0);
      expect(engine.players[0].health).toBe(engine.players[0].maxHealth);

      engine.setPlayerStat(0, "maxHealth", 120);
      expect(engine.players[0].maxHealth).toBe(120);

      engine.unlockAllSkills(0);
      engine.giveAllWeapons(0);
      engine.givePotions(0);
      engine.addGold(500);

      engine.killAllEnemies();
      expect(engine.enemies.every((e) => e.isDead || e.health === 0)).toBe(true);

      const dummy = engine.spawnEnemy("dummy", 100, 100);
      expect(dummy).toBeDefined();

      engine.damageEnemy(dummy.id, 50);
      engine.removeEnemy(dummy.id);

      engine.triggerParticleBurst("spark", 10);
      engine.forceVictory();
      expect(engine.isVictory).toBe(true);

      engine.forceDefeat();
      expect(engine.isDefeat).toBe(true);

      // Player command delegations
      engine.usePlayerPotion(0, 0);
      engine.discardPlayerItem(0, 0);
      engine.equipPlayerItem(0, 0);
      engine.unequipPlayerItem(0, "mainHand");
      engine.unlockPlayerSkill(0, "valen_skill_1");
      engine.assignPlayerSpell(0, "spell_arcane_bolt", "primary");
      engine.resetPlayerInventoryToDefaults();
      engine.resetPlayerSkillsToDefaults();
    });

    it("exposes subsystem getters and facade properties", () => {
      expect(engine.engineLogger).toBeDefined();
      expect(engine.debugController).toBeDefined();
      expect(engine.playerCommands).toBeDefined();
      expect(engine.level).toBeDefined();
      expect(engine.environmentCollisions).toBeDefined();
      expect(engine.currentNarrationText).toBeDefined();

      engine.isLevelTransitionPending = true;
      expect(engine.isLevelTransitionPending).toBe(true);
      engine.isLevelTransitionPending = false;
    });

    it("triggers magic spell casting during fixedUpdate when magic input is pressed", () => {
      const p1 = engine.players[0];
      p1.magicCooldown = 0;
      p1.mana = 50;

      // Mock inputs for player
      (engine as any).inputs = {
        getInputs: () => ({
          left: false,
          right: false,
          up: false,
          down: false,
          jump: false,
          action1: false,
          action2: false,
          magic1: true,
          magic2: false,
          potion1: false,
          potion2: false,
          potion3: false,
        }),
      };

      engine.fixedUpdate(1.0);

      expect(p1.isCasting).toBe(true);
      expect(engine.projectiles.length).toBeGreaterThan(0);
    });

    it("triggers potions during fixedUpdate when potion input is pressed", () => {
      // Mock inputs with potion1
      (engine as any).inputs = {
        getInputs: () => ({
          left: false,
          right: false,
          up: false,
          down: false,
          jump: false,
          action1: false,
          action2: false,
          magic1: false,
          magic2: false,
          potion1: true,
          potion2: true,
          potion3: true,
        }),
      };

      expect(() => engine.fixedUpdate(1.0)).not.toThrow();
    });
  });

  describe("Tick & Decoupled Rendering", () => {
    it("executes synchronized tick without error", () => {
      engine.tick(1.0);
      expect(engine.simulationTicks).toBeGreaterThan(0);
    });

    it("executes renderFrame with attached canvas renderer", () => {
      const { canvas } = createMockCanvas(1280, 720);
      engine.attachCanvas(canvas);

      expect(() => engine.renderFrame(0.5)).not.toThrow();
    });
  });
});
