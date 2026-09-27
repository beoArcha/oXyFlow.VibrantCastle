import { describe, it, expect, beforeEach } from "bun:test";
import { DebugCheatsController, IDebugCheatsContext } from "../debugCheatsController";
import { Player, Enemy, PlayerId, SoundType } from "../../types";
import { GameEngine } from "../../loop/engine";

describe("DebugCheatsController (SRP & Clean Code)", () => {
  let mockPlayer: Player;
  let mockEnemy1: Enemy;
  let mockEnemy2: Enemy;
  let mockContext: IDebugCheatsContext;
  let controller: DebugCheatsController;
  let bursts: Array<{ x: number; y: number; color: string; type: string; count: number }>;
  let sfxPlayed: SoundType[];
  let reactNotifications: number;
  let recordedKills: Array<{ playerId: PlayerId; enemyId: string }>;
  let victorySet: boolean;
  let defeatSet: boolean;
  let engineStopped: boolean;
  let narratedKeys: string[];

  beforeEach(() => {
    bursts = [];
    sfxPlayed = [];
    reactNotifications = 0;
    recordedKills = [];
    victorySet = false;
    defeatSet = false;
    engineStopped = false;
    narratedKeys = [];

    mockPlayer = {
      id: PlayerId.Player1,
      name: "Valen",
      x: 100,
      y: 200,
      vx: 5,
      vy: -10,
      width: 32,
      height: 48,
      health: 50,
      maxHealth: 100,
      mana: 20,
      maxMana: 50,
      stamina: 30,
      maxStamina: 80,
      isGrounded: true,
      isDead: false,
      facingLeft: false,
      skillPoints: 2,
      unlockedSkills: ["strike"],
      primarySpellId: "fireball",
      secondarySpellId: "teleport",
      inventory: {
        equipped: {
          mainHand: null,
          offHand: null,
          armor: null,
          accessory: null,
        },
        backpack: [null, null, null, null, null, null, null, null, null, null, null, null],
        quickPotions: [null, null, null],
      },
    } as unknown as Player;

    mockEnemy1 = {
      id: "enemy_1",
      defaultName: "Gargoyle",
      x: 300,
      y: 200,
      vx: 0,
      vy: 0,
      width: 32,
      height: 36,
      health: 100,
      maxHealth: 100,
      isDead: false,
      patrolMinX: 100,
      patrolMaxX: 500,
      facingLeft: true,
      damageTimer: 0,
    } as unknown as Enemy;

    mockEnemy2 = {
      id: "enemy_2",
      defaultName: "Skeleton",
      x: 400,
      y: 200,
      vx: 0,
      vy: 0,
      width: 38,
      height: 52,
      health: 80,
      maxHealth: 80,
      isDead: false,
      patrolMinX: 200,
      patrolMaxX: 600,
      facingLeft: false,
      damageTimer: 0,
    } as unknown as Enemy;

    const players = [mockPlayer];
    const enemies = [mockEnemy1, mockEnemy2];

    mockContext = {
      getPlayers: () => players,
      getEnemies: () => enemies,
      getLevelDimensions: () => ({ width: 1000, height: 600 }),
      spawnBurst: (x, y, color, type, count) => {
        bursts.push({ x, y, color, type, count });
      },
      playSFX: (type) => {
        sfxPlayed.push(type);
      },
      recordKill: (playerId, enemyId) => {
        recordedKills.push({ playerId, enemyId });
      },
      triggerNarration: (key) => {
        narratedKeys.push(key);
      },
      stopEngine: () => {
        engineStopped = true;
      },
      setVictory: (v) => {
        victorySet = v;
      },
      setDefeat: (d) => {
        defeatSet = d;
      },
      notifyReact: () => {
        reactNotifications++;
      },
    };

    controller = new DebugCheatsController(mockContext);
  });

  describe("Player teleportation", () => {
    it("teleports player and clamps within level boundaries", () => {
      controller.teleportPlayer(PlayerId.Player1, 500, 300);

      expect(mockPlayer.x).toBe(500);
      expect(mockPlayer.y).toBe(300);
      expect(mockPlayer.vx).toBe(0);
      expect(mockPlayer.vy).toBe(0);
      expect(mockPlayer.isGrounded).toBe(false);
      expect(bursts.length).toBe(2); // departure and arrival
      expect(sfxPlayed).toContain(SoundType.SFX_UNLOCK);
      expect(reactNotifications).toBe(1);
    });

    it("clamps coordinates if destination is outside bounds", () => {
      controller.teleportPlayer(PlayerId.Player1, -50, 9999);

      expect(mockPlayer.x).toBe(0);
      expect(mockPlayer.y).toBe(600 - mockPlayer.height);
    });

    it("safely ignores non-finite and NaN destination coordinates", () => {
      const origX = mockPlayer.x;
      const origY = mockPlayer.y;

      controller.teleportPlayer(PlayerId.Player1, NaN, 300);
      expect(mockPlayer.x).toBe(origX);
      expect(mockPlayer.y).toBe(origY);

      controller.teleportPlayer(PlayerId.Player1, 300, Infinity);
      expect(mockPlayer.x).toBe(origX);
      expect(mockPlayer.y).toBe(origY);
    });
  });

  describe("Enemy management", () => {
    it("damages single enemy and plays hit feedback", () => {
      const initialHp = mockEnemy1.health;
      const success = controller.damageEnemy("enemy_1", 30);

      expect(success).toBe(true);
      expect(mockEnemy1.health).toBe(initialHp - 30);
      expect(mockEnemy1.isDead).toBe(false);
      expect(sfxPlayed).toContain(SoundType.SFX_HIT);
      expect(reactNotifications).toBe(1);
    });

    it("damages single enemy lethally, marks as dead, and records kill", () => {
      const success = controller.damageEnemy("enemy_1", 999);

      expect(success).toBe(true);
      expect(mockEnemy1.health).toBe(0);
      expect(mockEnemy1.isDead).toBe(true);
      expect(recordedKills).toContainEqual({ playerId: PlayerId.Player1, enemyId: "enemy_1" });
    });

    it("removes enemy cleanly from collection and triggers notification", () => {
      const success = controller.removeEnemy("enemy_1");

      expect(success).toBe(true);
      expect(mockContext.getEnemies().some((e) => e.id === "enemy_1")).toBe(false);
      expect(reactNotifications).toBe(1);

      // Subsequent remove of same enemy returns false
      expect(controller.removeEnemy("enemy_1")).toBe(false);
    });

    it("kills all living enemies, triggers bursts, and records kills", () => {
      controller.killAllEnemies();

      expect(mockEnemy1.health).toBe(0);
      expect(mockEnemy1.isDead).toBe(true);
      expect(mockEnemy2.health).toBe(0);
      expect(mockEnemy2.isDead).toBe(true);
      expect(recordedKills).toEqual([
        { playerId: PlayerId.Player1, enemyId: "enemy_1" },
        { playerId: PlayerId.Player1, enemyId: "enemy_2" },
      ]);
      expect(sfxPlayed).toContain(SoundType.SFX_HIT);
      expect(reactNotifications).toBe(1);
    });

    it("spawns enemies with appropriate preset configurations", () => {
      const dummy = controller.spawnEnemy("dummy", 150, 250);
      expect(dummy.isDummy).toBe(true);
      expect(dummy.health).toBe(9999);
      expect(mockContext.getEnemies()).toContain(dummy);

      const boss = controller.spawnEnemy("sentinel_boss");
      expect(boss.width).toBe(56);
      expect(boss.height).toBe(70);
      expect(boss.health).toBe(600);

      const aerial = controller.spawnEnemy("gargoyle_flyer");
      expect(aerial.isAerial).toBe(true);
      expect(aerial.health).toBe(120);
    });
  });

  describe("Vitals & stats", () => {
    it("refills player health, mana, stamina, and revives if dead", () => {
      mockPlayer.health = 0;
      mockPlayer.isDead = true;
      mockPlayer.mana = 0;
      mockPlayer.stamina = 0;

      controller.refillVitals(0);

      expect(mockPlayer.health).toBe(mockPlayer.maxHealth);
      expect(mockPlayer.mana).toBe(mockPlayer.maxMana);
      expect(mockPlayer.stamina).toBe(mockPlayer.maxStamina);
      expect(mockPlayer.isDead).toBe(false);
      expect(sfxPlayed).toContain(SoundType.SFX_POTION);
      expect(reactNotifications).toBe(1);
    });

    it("clamps player stats between 1 and 9999 and lowers current value if max is reduced", () => {
      controller.setPlayerStat(0, "maxHealth", 40);
      expect(mockPlayer.maxHealth).toBe(40);
      expect(mockPlayer.health).toBe(40); // clamped down from 50

      controller.setPlayerStat(0, "health", 15000);
      expect(mockPlayer.health).toBe(9999);
    });
  });

  describe("Skills & inventory cheats", () => {
    it("unlocks all skills and grants skill points", () => {
      controller.unlockAllSkills(0);

      expect(mockPlayer.unlockedSkills.length).toBeGreaterThan(1);
      expect(mockPlayer.skillPoints).toBeGreaterThanOrEqual(10);
      expect(sfxPlayed).toContain(SoundType.SFX_SKILL_UNLOCK);
      expect(reactNotifications).toBe(1);
    });

    it("gives all registered weapons into empty backpack slots", () => {
      controller.giveAllWeapons(0);

      const weaponSlots = mockPlayer.inventory.backpack.filter((s) => s !== null && s.type === "weapon");
      expect(weaponSlots.length).toBeGreaterThan(0);
      expect(sfxPlayed).toContain(SoundType.SFX_SAVE);
    });

    it("gives quick potions stack", () => {
      controller.givePotions(0);

      expect(mockPlayer.inventory.quickPotions[0]?.count).toBe(5);
      expect(mockPlayer.inventory.quickPotions[1]?.count).toBe(5);
      expect(mockPlayer.inventory.quickPotions[2]?.count).toBe(5);
      expect(sfxPlayed).toContain(SoundType.SFX_POTION);
    });

    it("clears inventory backpack", () => {
      mockPlayer.inventory.backpack[0] = { id: "item1" } as any;
      controller.clearInventory(0);

      expect(mockPlayer.inventory.backpack.every((slot) => slot === null)).toBe(true);
      expect(sfxPlayed).toContain(SoundType.SFX_HIT);
    });

    it("adds gold and awards skill points proportionally", () => {
      const initialPoints = mockPlayer.skillPoints;
      controller.addGold(1500);

      expect(mockPlayer.skillPoints).toBe(initialPoints + 3);
      expect(sfxPlayed).toContain(SoundType.SFX_UNLOCK);
    });
  });

  describe("Game flow & particle debug actions", () => {
    it("forces victory and stops the game loop", () => {
      controller.forceVictory();

      expect(victorySet).toBe(true);
      expect(narratedKeys).toContain("trainingGoalSuccess");
      expect(engineStopped).toBe(true);
      expect(sfxPlayed).toContain(SoundType.SFX_SKILL_UNLOCK);
    });

    it("forces defeat and notifies player state", () => {
      controller.forceDefeat();

      expect(mockPlayer.health).toBe(0);
      expect(mockPlayer.isDead).toBe(true);
      expect(defeatSet).toBe(true);
      expect(narratedKeys).toContain("defeat");
      expect(sfxPlayed).toContain(SoundType.SFX_HIT);
    });

    it("triggers particle bursts at player position", () => {
      controller.triggerParticleBurst("spark", 30);

      expect(bursts.length).toBe(1);
      expect(bursts[0].type).toBe("spark");
      expect(bursts[0].count).toBe(30);
      expect(bursts[0].color).toBe("#f59e0b");
    });
  });

  describe("GameEngine delegation integration", () => {
    it("exposes debugController and delegates cheat methods seamlessly", () => {
      const engine = new GameEngine();
      expect(engine.debugController).toBeDefined();

      const p1 = engine.players[0];
      const initialX = p1.x;

      engine.teleportPlayer(PlayerId.Player1, 400, 300);
      expect(p1.x).toBe(400);
      expect(p1.y).toBe(300);

      engine.addGold(1000);
      expect(p1.skillPoints).toBeGreaterThan(0);
    });
  });
});
