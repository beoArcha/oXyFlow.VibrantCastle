import { SaveState } from "@game/types";
import { Result, ok, err, SaveError, ErrorCode } from "@lib/errors";
import { ISaveValidator } from "./saveTypes";

/**
 * Validates and normalizes raw JSON data into a structured SaveState.
 * Ensures numerical validity, finite bounds, and schema integrity.
 */
export class SaveValidator implements ISaveValidator {
  /**
   * Validates and parses a raw JSON string into a structured SaveState.
   * Rejects malformed strings, invalid schemas, NaN, and infinite numbers.
   */
  public parseSaveJson(rawJson: string): Result<SaveState, SaveError> {
    if (!rawJson || typeof rawJson !== "string") {
      return err(
        new SaveError("Save input must be a non-empty string", ErrorCode.SAVE_CORRUPTED_JSON)
      );
    }

    try {
      const parsed = JSON.parse(rawJson) as Partial<SaveState>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return err(
          new SaveError("Save data must decode to a valid JSON object", ErrorCode.SAVE_CORRUPTED_JSON)
        );
      }

      const hasValidHealth =
        typeof parsed.p1Health === "number" && Number.isFinite(parsed.p1Health);
      const hasValidCoords =
        typeof parsed.checkpointX === "number" &&
        Number.isFinite(parsed.checkpointX) &&
        typeof parsed.checkpointY === "number" &&
        Number.isFinite(parsed.checkpointY);
      const hasValidLevel =
        typeof parsed.levelId === "string" && parsed.levelId.trim().length > 0;

      if (!hasValidHealth || !hasValidCoords || !hasValidLevel) {
        return err(
          new SaveError(
            "Save state is missing vital fields (p1Health, checkpoint, levelId)",
            ErrorCode.SAVE_CORRUPTED_JSON,
            {
              details: {
                hasLevelId: hasValidLevel,
                hasHealth: hasValidHealth,
                hasCoordinates: hasValidCoords,
              },
            }
          )
        );
      }

      const normalized: SaveState = {
        timestamp: parsed.timestamp || new Date().toISOString(),
        p1Health: parsed.p1Health!,
        p1Mana:
          typeof parsed.p1Mana === "number" && Number.isFinite(parsed.p1Mana)
            ? parsed.p1Mana
            : 100,
        p1Stamina:
          typeof parsed.p1Stamina === "number" && Number.isFinite(parsed.p1Stamina)
            ? parsed.p1Stamina
            : 100,
        p1Score:
          typeof parsed.p1Score === "number" && Number.isFinite(parsed.p1Score)
            ? parsed.p1Score
            : 0,
        p1SkillPoints:
          typeof parsed.p1SkillPoints === "number" && Number.isFinite(parsed.p1SkillPoints)
            ? parsed.p1SkillPoints
            : 0,
        p1UnlockedSkills: Array.isArray(parsed.p1UnlockedSkills) ? parsed.p1UnlockedSkills : [],
        p1PrimarySpellId: parsed.p1PrimarySpellId,
        p1SecondarySpellId: parsed.p1SecondarySpellId,
        p1Inventory: parsed.p1Inventory,
        p2Health:
          typeof parsed.p2Health === "number" && Number.isFinite(parsed.p2Health)
            ? parsed.p2Health
            : 0,
        p2Mana:
          typeof parsed.p2Mana === "number" && Number.isFinite(parsed.p2Mana)
            ? parsed.p2Mana
            : 0,
        p2Stamina:
          typeof parsed.p2Stamina === "number" && Number.isFinite(parsed.p2Stamina)
            ? parsed.p2Stamina
            : 0,
        p2Score:
          typeof parsed.p2Score === "number" && Number.isFinite(parsed.p2Score)
            ? parsed.p2Score
            : 0,
        p2SkillPoints: parsed.p2SkillPoints,
        p2UnlockedSkills: parsed.p2UnlockedSkills,
        p2PrimarySpellId: parsed.p2PrimarySpellId,
        p2SecondarySpellId: parsed.p2SecondarySpellId,
        p2Inventory: parsed.p2Inventory,
        levelId: parsed.levelId!,
        activatedLevers: Array.isArray(parsed.activatedLevers) ? parsed.activatedLevers : [],
        defeatedEnemies: Array.isArray(parsed.defeatedEnemies) ? parsed.defeatedEnemies : [],
        checkpointX: parsed.checkpointX!,
        checkpointY: parsed.checkpointY!,
        stats: parsed.stats,
      };

      return ok(normalized);
    } catch (e) {
      return err(
        new SaveError("Failed to parse save JSON: Syntax error", ErrorCode.SAVE_CORRUPTED_JSON, {
          cause: e,
        })
      );
    }
  }
}

export const defaultSaveValidator = new SaveValidator();
