import { SaveState, Player, Enemy, Entity } from "@game/types";
import { statsManager } from "../stats";
import { calculatePlayerDerivedStats } from "../inventory";
import { saveLogger } from "@game/logger/gameLogger";
import { Result, ok, err, SaveError, ErrorCode } from "@lib/errors";
import { ISaveApplicator } from "./saveTypes";

/**
 * Applies a verified SaveState onto live game session objects.
 * Restores player vitals, inventories, equipment, activated levers, and defeated enemies.
 */
export class SaveApplicator implements ISaveApplicator {
  private safeClone<T>(data: T): T | undefined {
    if (data === undefined || data === null) {
      return undefined;
    }
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error: unknown) {
      saveLogger.warn("Failed to safely clone inventory data in SaveApplicator", undefined, error);
      return undefined;
    }
  }

  public applySaveState(
    state: SaveState,
    players: Player[],
    enemies: Enemy[] = [],
    entities: Entity[] = []
  ): Result<true, SaveError> {
    if (!state || typeof state !== "object") {
      const error = new SaveError(
        "Cannot apply invalid save state object",
        ErrorCode.SAVE_CORRUPTED_JSON
      );
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }
    if (!Array.isArray(players)) {
      const error = new SaveError(
        "Cannot apply save: Invalid players list",
        ErrorCode.SAVE_WRITE_FAILED
      );
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }
    const p1 = players.find((p) => p && p.id === "player1");
    if (!p1) {
      const error = new SaveError(
        "Cannot apply save: Player 1 not found in session",
        ErrorCode.SAVE_WRITE_FAILED
      );
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }

    try {
      if (state.p1CharacterId) {
        p1.characterId = state.p1CharacterId;
        p1.characterName = state.p1CharacterId === "aurelia" ? "Aurelia" : "Valen";
      }

      p1.x = state.checkpointX;
      p1.y = state.checkpointY;
      p1.health = state.p1Health;
      p1.mana = state.p1Mana !== undefined ? state.p1Mana : p1.maxMana;
      p1.stamina = state.p1Stamina !== undefined ? state.p1Stamina : p1.maxStamina;
      p1.score = state.p1Score;
      if (state.p1SkillPoints !== undefined) p1.skillPoints = state.p1SkillPoints;
      if (state.p1UnlockedSkills) p1.unlockedSkills = state.p1UnlockedSkills;
      if (state.p1PrimarySpellId) p1.primarySpellId = state.p1PrimarySpellId;
      if (state.p1SecondarySpellId) p1.secondarySpellId = state.p1SecondarySpellId;
      if (state.p1Inventory && typeof state.p1Inventory === "object") {
        p1.inventory = this.safeClone(state.p1Inventory) || p1.inventory;
        const stats = calculatePlayerDerivedStats(p1);
        p1.maxHealth = stats.maxHp;
        p1.maxMana = stats.maxMana;
        p1.maxStamina = stats.maxStamina;
      }
      p1.isDead = p1.health <= 0;
      p1.vx = 0;
      p1.vy = 0;

      const p2 = players.find((p) => p && p.id === "player2");
      if (p2 && typeof state.p2Health === "number" && state.p2Health > 0) {
        if (state.p2CharacterId) {
          p2.characterId = state.p2CharacterId;
          p2.characterName = state.p2CharacterId === "valen" ? "Valen" : "Aurelia";
        }
        p2.x = state.checkpointX - 30;
        p2.y = state.checkpointY;
        p2.health = state.p2Health;
        p2.mana = state.p2Mana !== undefined ? state.p2Mana : p2.maxMana;
        p2.stamina = state.p2Stamina !== undefined ? state.p2Stamina : p2.maxStamina;
        p2.score = state.p2Score;
        if (state.p2SkillPoints !== undefined) p2.skillPoints = state.p2SkillPoints;
        if (state.p2UnlockedSkills) p2.unlockedSkills = state.p2UnlockedSkills;
        if (state.p2PrimarySpellId) p2.primarySpellId = state.p2PrimarySpellId;
        if (state.p2SecondarySpellId) p2.secondarySpellId = state.p2SecondarySpellId;
        if (state.p2Inventory && typeof state.p2Inventory === "object") {
          p2.inventory = this.safeClone(state.p2Inventory) || p2.inventory;
          const stats = calculatePlayerDerivedStats(p2);
          p2.maxHealth = stats.maxHp;
          p2.maxMana = stats.maxMana;
          p2.maxStamina = stats.maxStamina;
        }
        p2.isDead = p2.health <= 0;
        p2.vx = 0;
        p2.vy = 0;
      }

      // Restore levers defensively
      const levers = Array.isArray(state.activatedLevers) ? state.activatedLevers : [];
      if (Array.isArray(entities)) {
        entities.forEach((entity) => {
          if (entity && entity.type === "lever") {
            entity.isActivated = levers.includes(entity.id);
          }
        });
      }

      // Restore defeated enemies defensively
      const defeated = Array.isArray(state.defeatedEnemies) ? state.defeatedEnemies : [];
      if (Array.isArray(enemies)) {
        enemies.forEach((enemy) => {
          if (enemy && defeated.includes(enemy.id)) {
            enemy.isDead = true;
            enemy.health = 0;
          }
        });
      }

      // Restore statistics if present
      if (state.stats && typeof state.stats === "object") {
        try {
          statsManager.loadStats(state.stats);
        } catch (e) {
          saveLogger.warn(
            "Failed to load stats from save state",
            { levelId: state.levelId, timestamp: state.timestamp },
            e
          );
        }
      }

      return ok(true);
    } catch (e) {
      const error = new SaveError(
        "Failed to apply save state to active game entities",
        ErrorCode.SAVE_WRITE_FAILED,
        { cause: e }
      );
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }
  }
}

export const defaultSaveApplicator = new SaveApplicator();
