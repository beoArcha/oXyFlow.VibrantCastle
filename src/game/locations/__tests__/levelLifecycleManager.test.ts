import { describe, it, expect, beforeEach } from "bun:test";
import {
  LevelLifecycleManager,
  ILevelLifecycleContext,
} from "../levelLifecycleManager";
import {
  Player,
  Enemy,
  Entity,
  PlayerId,
  CollisionType,
  SoundType,
} from "../../types";

describe("LevelLifecycleManager (SOLID & SRP)", () => {
  let players: Player[];
  let enemies: Enemy[];
  let entities: Entity[];
  let projectiles: unknown[];
  let isTwoPlayer: boolean;
  let sfxPlayed: SoundType[];
  let musicIntensity: number;
  let bursts: Array<{ x: number; y: number; color: string; type: string; count: number }>;
  let narratedKeys: string[];
  let cameraSnaps: Array<{ count: number; width: number; height: number }>;
  let engineRunning: boolean;
  let reactNotifications: number;
  let context: ILevelLifecycleContext;
  let manager: LevelLifecycleManager;

  beforeEach(() => {
    players = [];
    enemies = [];
    entities = [];
    projectiles = [{ id: "proj_1" }];
    isTwoPlayer = false;
    sfxPlayed = [];
    musicIntensity = 0;
    bursts = [];
    narratedKeys = [];
    cameraSnaps = [];
    engineRunning = true;
    reactNotifications = 0;

    context = {
      getPlayers: () => players,
      setPlayers: (p) => {
        players = p;
      },
      getEnemies: () => enemies,
      setEnemies: (e) => {
        enemies = e;
      },
      getEntities: () => entities,
      setEntities: (ent) => {
        entities = ent;
      },
      clearProjectiles: () => {
        projectiles = [];
      },
      getIsTwoPlayer: () => isTwoPlayer,
      setIsTwoPlayer: (val) => {
        isTwoPlayer = val;
      },
      getViewportSize: () => ({ width: 1280, height: 720 }),
      snapCamera: (pList, w, h) => {
        cameraSnaps.push({ count: pList.length, width: w, height: h });
      },
      triggerNarration: (key) => {
        narratedKeys.push(key);
      },
      resetNarration: () => {},
      playSFX: (type) => {
        sfxPlayed.push(type);
      },
      setMusicIntensity: (intensity) => {
        musicIntensity = intensity;
      },
      spawnBurst: (x, y, color, type, count) => {
        bursts.push({ x, y, color, type, count });
      },
      stopEngine: () => {
        engineRunning = false;
      },
      startEngine: () => {
        engineRunning = true;
      },
      isRunning: () => engineRunning,
      notifyReact: () => {
        reactNotifications++;
      },
    };

    manager = new LevelLifecycleManager(context);
  });

  describe("Level Initialization and Reset", () => {
    it("resets level to courtyard by default, populates entities, and clears projectiles", () => {
      manager.resetLevel("courtyard");

      expect(manager.currentLocationId).toBe("courtyard");
      expect(manager.currentLocation.id).toBe("courtyard");
      expect(players.length).toBe(1);
      expect(enemies.length).toBeGreaterThan(0);
      expect(entities.length).toBeGreaterThan(0);
      expect(projectiles.length).toBe(0);
      expect(manager.levelWidth).toBeGreaterThan(1000);
      expect(manager.levelHeight).toBeGreaterThan(500);
      expect(cameraSnaps.length).toBe(1);
      expect(narratedKeys.length).toBeGreaterThan(0);
      expect(musicIntensity).toBeGreaterThan(0);
      expect(reactNotifications).toBe(1);
    });

    it("preserves player stats across level resets if preservePlayerStats is true", () => {
      manager.resetLevel("courtyard");
      expect(players.length).toBe(1);

      players[0].health = 42;
      players[0].mana = 13;

      manager.resetLevel("clocktower", undefined, true);
      expect(manager.currentLocationId).toBe("clocktower");
      expect(players[0].health).toBe(42);
      expect(players[0].mana).toBe(13);
    });
  });

  describe("Location Loading and Navigation", () => {
    it("loads location, resets level, and restarts engine if it was stopped", () => {
      engineRunning = false;
      manager.loadLocation("thorn_chasm");

      expect(manager.currentLocationId).toBe("thorn_chasm");
      expect(engineRunning).toBe(true);
    });

    it("advances sequentially to next location", () => {
      manager.resetLevel("courtyard");
      manager.advanceToNextLocation();

      expect(manager.currentLocationId).toBe("thorn_chasm");
    });
  });

  describe("Two-Player Mode Spawning", () => {
    it("spawns player 2 with offset when enabling two-player mode", () => {
      manager.resetLevel("courtyard");
      expect(players.length).toBe(1);

      const p1X = players[0].x;
      manager.setTwoPlayerMode(true, true);

      expect(isTwoPlayer).toBe(true);
      expect(players.length).toBe(2);
      expect(players[1].id).toBe(PlayerId.Player2);
      expect(players[1].x).toBeGreaterThan(p1X);
      expect(reactNotifications).toBeGreaterThan(1);
    });

    it("removes player 2 cleanly when disabling two-player mode", () => {
      manager.resetLevel("courtyard");
      manager.setTwoPlayerMode(true, true);
      expect(players.length).toBe(2);

      manager.setTwoPlayerMode(false, true);
      expect(isTwoPlayer).toBe(false);
      expect(players.length).toBe(1);
      expect(players[0].id).toBe(PlayerId.Player1);
    });
  });

  describe("Lever and Gate Unlocks", () => {
    it("lifts gates out of collision bounds when lever is pulled", () => {
      manager.resetLevel("courtyard");
      const gate = entities.find(
        (e) => e.type === CollisionType.Solid && (e.id.includes("gate") || e.id.includes("wall"))
      );

      if (gate) {
        manager.handleLeverUnlocks("lever_1");
        expect(gate.y).toBe(-1000);
        expect(sfxPlayed).toContain(SoundType.SFX_UNLOCK);
        expect(bursts.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Goal and Portal Teleportation", () => {
    it("transitions across locations upon reaching portal", () => {
      manager.resetLevel("courtyard");

      const portalEntity: Entity = {
        id: "courtyard_portal",
        x: 1000,
        y: 300,
        width: 48,
        height: 80,
        type: CollisionType.Goal,
        targetLocationId: "clocktower",
      };

      manager.handleGoalCompletion(portalEntity);

      expect(manager.currentLocationId).toBe("clocktower");
      expect(sfxPlayed).toContain(SoundType.SFX_SAVE);
      expect(bursts.length).toBe(1);
      expect(manager.portalCooldownTimer).toBe(45);
      expect(manager.isLevelTransitionPending).toBe(true);
      expect(manager.consumeLevelTransitionPending()).toBe(true);
      expect(manager.consumeLevelTransitionPending()).toBe(false);
    });

    it("triggers victory and stops engine when reaching Grand Bastion final portal", () => {
      manager.resetLevel("grand_bastion");

      const finalPortal: Entity = {
        id: "grand_portal",
        x: 1500,
        y: 300,
        width: 48,
        height: 80,
        type: CollisionType.Goal,
        targetLocationId: "courtyard",
      };

      manager.handleGoalCompletion(finalPortal);

      expect(manager.isVictory).toBe(true);
      expect(engineRunning).toBe(false);
      expect(narratedKeys).toContain("trainingGoalSuccess");
    });

    it("decrements portal cooldown timer down to zero", () => {
      manager.portalCooldownTimer = 2;
      manager.decrementCooldowns();
      expect(manager.portalCooldownTimer).toBe(1);
      manager.decrementCooldowns();
      expect(manager.portalCooldownTimer).toBe(0);
      manager.decrementCooldowns();
      expect(manager.portalCooldownTimer).toBe(0);
    });
  });

  describe("GameEngine Integration & Delegation", () => {
    it("exposes level manager and delegates location lifecycle seamlessly", async () => {
      const { GameEngine } = await import("../../loop/engine");
      const engine = new GameEngine();

      expect(engine.level).toBeDefined();
      expect(engine.currentLocationId).toBe("courtyard");
      expect(engine.levelWidth).toBeGreaterThan(1000);

      // Test loadLocation delegation
      engine.loadLocation("thorn_chasm");
      expect(engine.currentLocationId).toBe("thorn_chasm");
      expect(engine.level.currentLocationId).toBe("thorn_chasm");

      // Test setTwoPlayerMode delegation
      engine.setTwoPlayerMode(true, true);
      expect(engine.players.length).toBe(2);

      engine.setTwoPlayerMode(false, true);
      expect(engine.players.length).toBe(1);
    });
  });
});

