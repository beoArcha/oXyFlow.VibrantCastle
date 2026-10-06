import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GameEngine } from "@game/loop/engine";
import { GameInputEngine } from "@game/loop/input";
import { PlayerId, InputMap } from "@game/types";
import { spellCodec } from "@lib/codecs/spellCodec";
import { enemyCodec } from "@lib/codecs/enemyCodec";
import { itemCodec } from "@lib/codecs/itemCodec";
import rawSpells from "@data/skills/spells.json";
import rawEnemies from "@data/enemies/enemies.json";
import rawItems from "@data/items/items.json";

class TestInputEngine extends GameInputEngine {
  private inputs: Record<PlayerId, Partial<InputMap>> = {
    [PlayerId.Player1]: {},
    [PlayerId.Player2]: {},
  };

  public setAction(id: PlayerId, action: keyof InputMap, pressed: boolean) {
    this.inputs[id][action] = pressed;
  }

  public override getInputs(id: PlayerId): InputMap {
    const custom = this.inputs[id];
    return {
      left: !!custom.left,
      right: !!custom.right,
      up: !!custom.up,
      down: !!custom.down,
      jump: !!custom.jump,
      action1: !!custom.action1,
      action2: !!custom.action2,
      magic1: !!custom.magic1,
      magic2: !!custom.magic2,
      potion1: !!custom.potion1,
      potion2: !!custom.potion2,
      potion3: !!custom.potion3,
    };
  }
}

describe("RPG Data Loading and Combat Simulation Integration", () => {
  let engine: GameEngine;
  let testInputs: TestInputEngine;

  beforeEach(() => {
    testInputs = new TestInputEngine();
    engine = new GameEngine({ inputs: testInputs });
    engine.resetLevel("courtyard");
  });

  afterEach(() => {
    engine.stop();
  });

  it("loads and synchronizes master spells and enemy definitions with game engine", () => {
    const spellsResult = spellCodec.decodeDictionary(rawSpells);
    expect(spellsResult.isOk()).toBe(true);
    const spellsDict = spellsResult.unwrap();

    const enemiesResult = enemyCodec.decodeDictionary(rawEnemies);
    expect(enemiesResult.isOk()).toBe(true);
    const enemiesDict = enemiesResult.unwrap();

    const itemsResult = itemCodec.decodeDictionary(rawItems);
    expect(itemsResult.isOk()).toBe(true);
    const itemsDict = itemsResult.unwrap();

    expect(spellsDict["solar_flare"]).toBeDefined();
    expect(enemiesDict["training_dummy"]).toBeDefined();
    expect(itemsDict["solar_rapier"]).toBeDefined();
  });

  it("synchronizes player spell cast lifecycle with decoded RPG spell configuration", () => {
    const spellsResult = spellCodec.decodeDictionary(rawSpells);
    expect(spellsResult.isOk()).toBe(true);
    const solarFlareDef = spellsResult.unwrap()["solar_flare"];
    expect(solarFlareDef).toBeDefined();

    const player = engine.players[0];
    expect(player).toBeDefined();

    player.mana = 60;
    player.primarySpellId = solarFlareDef.id;
    player.magicCooldown = 0;
    player.facingLeft = false;

    const initialMana = player.mana;

    testInputs.setAction(PlayerId.Player1, "magic1", true);
    engine.fixedUpdate(1.0);
    testInputs.setAction(PlayerId.Player1, "magic1", false);

    // Mana is deducted by solarFlareDef.manaCost, offset by sub-integer per-frame regen
    expect(Math.floor(player.mana)).toBe(initialMana - solarFlareDef.manaCost);
    expect(player.magicCooldown).toBe(solarFlareDef.cooldownFrames);
  });
});
