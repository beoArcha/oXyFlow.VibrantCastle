import { describe, it, expect, beforeEach } from "bun:test";
import {
  LoggerManager,
  LogLevel,
  ILogTransport,
  LogRecord,
} from "@lib/logger";
import {
  createDefaultInventory,
  equipItem,
  unequipItem,
  consumePotion,
  discardItem,
} from "../inventory";
import { attemptCastSpell } from "../magic";
import { Player, InputMap, SoundType } from "../../types";

function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: "player1",
    name: "Valen",
    x: 100,
    y: 200,
    vx: 0,
    vy: 0,
    width: 32,
    height: 48,
    health: 50,
    maxHealth: 100,
    mana: 100,
    maxMana: 100,
    stamina: 100,
    maxStamina: 100,
    score: 0,
    skillPoints: 2,
    unlockedSkills: [],
    primarySpellId: "solar_flare",
    facingLeft: false,
    isGrounded: true,
    isCrouching: false,
    isAttacking: false,
    isCasting: false,
    castTime: 0,
    magicCooldown: 0,
    shieldActiveTime: 0,
    inventory: createDefaultInventory(),
    characterClass: "spellblade",
    ...overrides,
  } as Player;
}

const mockInputs: InputMap = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  action1: false,
  action2: false,
  magic1: false,
  magic2: false,
  potion1: false,
  potion2: false,
  potion3: false,
};

const mockAudio = {
  playSFX: (_type: SoundType) => {},
};

describe("Domain Logging", () => {
  let records: LogRecord[] = [];
  let testTransport: ILogTransport;

  beforeEach(() => {
    records = [];
    testTransport = {
      name: "DomainLoggingTestTransport",
      write: (r) => records.push(r),
    };

    const manager = LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
    manager.addTransport(testTransport);
  });

  describe("Inventory Domain Logging", () => {
    it("logs DEBUG on successful item equip and WARN on failure", () => {
      const player = createMockPlayer();

      // Successful equip from backpack slot 0 (frost_rapier)
      const equipRes = equipItem(player, 0);
      expect(equipRes.ok).toBe(true);

      const successLog = records.find(
        (r) => r.category === "game:inventory" && r.level === LogLevel.DEBUG && r.message.includes("equipped")
      );
      expect(successLog).toBeDefined();
      expect(successLog?.context?.itemId).toBe("frost_rapier");
      expect(successLog?.context?.targetSlot).toBe("mainHand");

      // Failed equip: empty backpack slot 10
      const failRes = equipItem(player, 10);
      expect(failRes.ok).toBe(false);

      const failLog = records.find(
        (r) => r.category === "game:inventory" && r.level === LogLevel.WARN && r.message.includes("No item found")
      );
      expect(failLog).toBeDefined();
      expect(failLog?.context?.code).toBe("GAMEPLAY_ITEM_NOT_FOUND");
    });

    it("logs DEBUG on successful unequip and WARN when slot is empty", () => {
      const player = createMockPlayer();

      // Successful unequip of mainHand (starts with solar_rapier)
      const unequipRes = unequipItem(player, "mainHand");
      expect(unequipRes.ok).toBe(true);

      const successLog = records.find(
        (r) => r.category === "game:inventory" && r.level === LogLevel.DEBUG && r.message.includes("unequipped")
      );
      expect(successLog).toBeDefined();
      expect(successLog?.context?.slot).toBe("mainHand");

      // Failed unequip: mainHand is now empty
      const failRes = unequipItem(player, "mainHand");
      expect(failRes.ok).toBe(false);

      const failLog = records.find(
        (r) => r.category === "game:inventory" && r.level === LogLevel.WARN && r.message.includes("empty")
      );
      expect(failLog).toBeDefined();
      expect(failLog?.context?.code).toBe("GAMEPLAY_ITEM_NOT_FOUND");
    });

    it("logs DEBUG on successful potion consumption and WARN on empty slot", () => {
      const player = createMockPlayer({ health: 50, maxHealth: 100 });

      // Default inventory has health potion in belt slot 0
      const consumeRes = consumePotion(player, 0);
      expect(consumeRes.ok).toBe(true);

      const successLog = records.find(
        (r) => r.category === "game:inventory" && r.level === LogLevel.DEBUG && r.message.includes("consumed potion")
      );
      expect(successLog).toBeDefined();
      expect(successLog?.context?.potionId).toBe("potion_health");

      // Consume until empty (count starts at 2)
      consumePotion(player, 0);
      records = [];

      // Failed consume: slot 0 is now empty
      const failRes = consumePotion(player, 0);
      expect(failRes.ok).toBe(false);

      const failLog = records.find(
        (r) => r.category === "game:inventory" && r.level === LogLevel.WARN && r.message.includes("empty")
      );
      expect(failLog).toBeDefined();
      expect(failLog?.context?.code).toBe("GAMEPLAY_ITEM_NOT_FOUND");
    });

    it("logs DEBUG on item discard and WARN when slot is empty", () => {
      const player = createMockPlayer();

      // Successful discard from backpack slot 0 (frost_rapier)
      const discardRes = discardItem(player, 0);
      expect(discardRes.ok).toBe(true);

      const successLog = records.find(
        (r) => r.category === "game:inventory" && r.level === LogLevel.DEBUG && r.message.includes("discarded item")
      );
      expect(successLog).toBeDefined();
      expect(successLog?.context?.itemId).toBe("frost_rapier");

      // Failed discard: slot 0 is now empty
      const failRes = discardItem(player, 0);
      expect(failRes.ok).toBe(false);

      const failLog = records.find(
        (r) => r.category === "game:inventory" && r.level === LogLevel.WARN && r.message.includes("No item found")
      );
      expect(failLog).toBeDefined();
      expect(failLog?.context?.code).toBe("GAMEPLAY_ITEM_NOT_FOUND");
    });
  });

  describe("Magic Domain Logging", () => {
    it("logs DEBUG on casting offensive spells", () => {
      const player = createMockPlayer({ mana: 100, stamina: 100, magicCooldown: 0 });

      const castRes = attemptCastSpell(player, "solar_flare", mockInputs, mockAudio);
      expect(castRes.ok).toBe(true);

      const log = records.find(
        (r) => r.category === "game:magic" && r.level === LogLevel.DEBUG && r.message.includes("Cast offensive spell")
      );
      expect(log).toBeDefined();
      expect(log?.context?.spellId).toBe("solar_flare");
      expect(log?.context?.playerId).toBe("player1");
      expect(log?.context?.projectileCount).toBe(1);
    });

    it("logs DEBUG on casting defensive shield spells", () => {
      const player = createMockPlayer({ mana: 100, stamina: 100, magicCooldown: 0 });

      const castRes = attemptCastSpell(player, "prismatic_shield", mockInputs, mockAudio);
      expect(castRes.ok).toBe(true);

      const log = records.find(
        (r) => r.category === "game:magic" && r.level === LogLevel.DEBUG && r.message.includes("Cast defensive spell")
      );
      expect(log).toBeDefined();
      expect(log?.context?.spellId).toBe("prismatic_shield");
      expect(log?.context?.shieldDurationFrames).toBeGreaterThan(0);
    });

    it("logs WARN on insufficient mana", () => {
      const player = createMockPlayer({ mana: 5, stamina: 100, magicCooldown: 0 });

      const castRes = attemptCastSpell(player, "solar_flare", mockInputs, mockAudio);
      expect(castRes.ok).toBe(false);

      const log = records.find(
        (r) => r.category === "game:magic" && r.level === LogLevel.WARN && r.message.includes("Insufficient mana")
      );
      expect(log).toBeDefined();
      expect(log?.context?.code).toBe("GAMEPLAY_INSUFFICIENT_MANA");
      expect((log?.context?.details as any)?.requiredMana).toBeGreaterThan(5);
    });

    it("logs WARN on active cooldown", () => {
      const player = createMockPlayer({ mana: 100, stamina: 100, magicCooldown: 25 });

      const castRes = attemptCastSpell(player, "solar_flare", mockInputs, mockAudio);
      expect(castRes.ok).toBe(false);

      const log = records.find(
        (r) => r.category === "game:magic" && r.level === LogLevel.WARN && r.message.includes("on cooldown")
      );
      expect(log).toBeDefined();
      expect(log?.context?.code).toBe("GAMEPLAY_COOLDOWN_ACTIVE");
      expect((log?.context?.details as any)?.cooldownFrames).toBe(25);
    });

    it("logs WARN on unregistered spell", () => {
      const player = createMockPlayer({ mana: 100, stamina: 100, magicCooldown: 0 });

      const castRes = attemptCastSpell(player, "unknown_dark_magic", mockInputs, mockAudio);
      expect(castRes.ok).toBe(false);

      const log = records.find(
        (r) => r.category === "game:magic" && r.level === LogLevel.WARN && r.message.includes("unregistered spell")
      );
      expect(log).toBeDefined();
      expect(log?.context?.code).toBe("GAMEPLAY_INVALID_ACTION");
    });
  });
});
