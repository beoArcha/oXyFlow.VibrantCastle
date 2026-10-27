import { SaveState, Player, Enemy, Entity } from "@game/types";
import { statsManager } from "../stats";
import { saveLogger } from "@game/logger/gameLogger";
import { Result, ok, err, SaveError, ErrorCode } from "@lib/errors";
import { ISaveCompiler } from "./saveTypes";

/**
 * Translates active session game entities into a SaveState DTO.
 * Operates without storage side-effects or I/O mutations.
 */
export class SaveCompiler implements ISaveCompiler {
  /**
   * Safely deep clones inventory or metadata to eliminate external mutation risks.
   */
  private safeClone<T>(data: T): T | undefined {
    if (data === undefined || data === null) {
      return undefined;
    }
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error: unknown) {
      saveLogger.warn("Failed to safely clone data in SaveCompiler safeClone", undefined, error);
      return undefined;
    }
  }

  /**
   * Pure compilation of active game session state into a SaveState structure.
   */
  public createSaveState(
    players: Player[] = [],
    enemies: Enemy[] = [],
    entities: Entity[] = [],
    levelId: string = "courtyard"
  ): Result<SaveState, SaveError> {
    if (!Array.isArray(players)) {
      const error = new SaveError(
        "Cannot save: Invalid players collection",
        ErrorCode.SAVE_WRITE_FAILED
      );
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }

    const p1 = players.find((p) => p && p.id === "player1");
    if (!p1) {
      const error = new SaveError(
        "Cannot save: Primary player not found in active session",
        ErrorCode.SAVE_WRITE_FAILED
      );
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }
    const p2 = players.find((p) => p && p.id === "player2");

    const activatedLevers = Array.isArray(entities)
      ? entities.filter((e) => e && e.type === "lever" && e.isActivated).map((e) => e.id)
      : [];

    const defeatedEnemies = Array.isArray(enemies)
      ? enemies.filter((e) => e && e.isDead).map((e) => e.id)
      : [];

    const state: SaveState = {
      timestamp: new Date().toISOString(),
      p1Health: p1.health,
      p1Mana: p1.mana,
      p1Stamina: p1.stamina,
      p1Score: p1.score,
      p1SkillPoints: p1.skillPoints,
      p1UnlockedSkills: Array.isArray(p1.unlockedSkills) ? [...p1.unlockedSkills] : [],
      p1PrimarySpellId: p1.primarySpellId,
      p1SecondarySpellId: p1.secondarySpellId,
      p1Inventory: this.safeClone(p1.inventory),
      p2Health: p2 ? p2.health : 0,
      p2Mana: p2 ? p2.mana : 0,
      p2Stamina: p2 ? p2.stamina : 0,
      p2Score: p2 ? p2.score : 0,
      p2SkillPoints: p2 ? p2.skillPoints : undefined,
      p2UnlockedSkills: p2 && Array.isArray(p2.unlockedSkills) ? [...p2.unlockedSkills] : undefined,
      p2PrimarySpellId: p2 ? p2.primarySpellId : undefined,
      p2SecondarySpellId: p2 ? p2.secondarySpellId : undefined,
      p2Inventory: p2 ? this.safeClone(p2.inventory) : undefined,
      levelId,
      activatedLevers,
      defeatedEnemies,
      checkpointX: p1.x,
      checkpointY: p1.y,
      stats: statsManager.getStats(),
    };

    return ok(state);
  }

  /**
   * Compiles state and returns a guaranteed SaveState instance, falling back gracefully if player1 is missing.
   */
  public compileSaveState(
    players: Player[] = [],
    enemies: Enemy[] = [],
    entities: Entity[] = [],
    levelId: string = "courtyard"
  ): SaveState {
    const res = this.createSaveState(players, enemies, entities, levelId);
    if (res.ok) {
      return res.value;
    }

    saveLogger.warn(
      "Failed to create full save state, compiling fallback defaults",
      res.error.toLogContext(),
      res.error
    );

    const p1 = Array.isArray(players) ? players.find((p) => p && p.id === "player1") : undefined;
    return {
      timestamp: new Date().toISOString(),
      p1Health: p1?.health ?? 100,
      p1Mana: p1?.mana ?? 100,
      p1Stamina: p1?.stamina ?? 100,
      p1Score: p1?.score ?? 0,
      p1SkillPoints: p1?.skillPoints ?? 0,
      p1UnlockedSkills: p1?.unlockedSkills ?? [],
      p2Health: 0,
      p2Mana: 0,
      p2Stamina: 0,
      p2Score: 0,
      levelId: levelId || "courtyard",
      activatedLevers: [],
      defeatedEnemies: [],
      checkpointX: p1?.x ?? 0,
      checkpointY: p1?.y ?? 0,
    };
  }
}

export const defaultSaveCompiler = new SaveCompiler();
