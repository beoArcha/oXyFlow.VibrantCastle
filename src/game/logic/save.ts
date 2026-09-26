import { SaveState, Player, Enemy, Entity, SoundType } from "../types";
import { gameAudio } from "../engine/audioEngine";
import { statsManager } from "./stats";
import { calculatePlayerDerivedStats } from "./inventory";
import { saveLogger } from "../logger/gameLogger";
import { Result, ok, err, SaveError, ErrorCode } from "../../lib/errors";

/**
 * Storage abstraction interface for Dependency Inversion.
 */
export interface ISaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Game Save Manager.
 * Implements real JSON file export and import, as well as offline LocalStorage fallback.
 * Designed according to SOLID principles:
 * - SRP: Encapsulates state compilation, serialization, validation, and storage operations.
 * - OCP: Extensible storage provider without modifying core serialization logic.
 * - LSP: Emits structured SaveError instances inheriting from GameBaseError.
 * - ISP: Exposes granular methods for compilation, persistence, parsing, and application.
 * - DIP: Accepts optional ISaveStorage provider for decoupled testing and runtime environments.
 */
export class GameSaveSystem {
  private readonly storageKey: string;
  private readonly customStorage?: () => ISaveStorage | null;

  constructor(
    storageKey: string = "vibrant_castle_save_state",
    customStorage?: () => ISaveStorage | null
  ) {
    this.storageKey = storageKey;
    this.customStorage = customStorage;
  }

  /**
   * Safely acquires browser/runtime storage instance with fallback for tests and Node/Bun.
   */
  private getStorage(): ISaveStorage | null {
    if (this.customStorage) {
      try {
        const custom = this.customStorage();
        if (custom) return custom;
      } catch {
        // Fall back to runtime detection
      }
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
    if (typeof window !== "undefined" && (window as any).localStorage) {
      return (window as any).localStorage;
    }
    if (typeof globalThis !== "undefined" && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
    return null;
  }

  /**
   * Returns the configured storage key identifier.
   */
  public getStorageKey(): string {
    return this.storageKey;
  }

  /**
   * Deep clones inventory or entity data safely without crashing on circular/undefined values.
   */
  private safeClone<T>(data: T): T | undefined {
    if (data === undefined || data === null) {
      return undefined;
    }
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      return undefined;
    }
  }

  /**
   * Pure compilation of active game session state into a SaveState structure (SRP).
   * Does not perform I/O or storage side-effects.
   */
  public createSaveState(
    players: Player[],
    enemies: Enemy[] = [],
    entities: Entity[] = [],
    levelId: string
  ): Result<SaveState, SaveError> {
    if (!Array.isArray(players)) {
      return err(
        new SaveError("Cannot save: Invalid players collection", ErrorCode.SAVE_WRITE_FAILED)
      );
    }

    const p1 = players.find((p) => p && p.id === "player1");
    if (!p1) {
      return err(
        new SaveError("Cannot save: Primary player not found in active session", ErrorCode.SAVE_WRITE_FAILED)
      );
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
   * Persists an existing SaveState object directly to storage.
   */
  public saveStateToStorage(state: SaveState): Result<true, SaveError> {
    const storage = this.getStorage();
    if (!storage) {
      return err(new SaveError("Storage environment unavailable", ErrorCode.SAVE_WRITE_FAILED));
    }

    try {
      storage.setItem(this.storageKey, JSON.stringify(state));
      return ok(true);
    } catch (e: any) {
      const isQuota = e?.name === "QuotaExceededError" || e?.code === 22;
      const saveError = new SaveError(
        isQuota ? "Storage quota exceeded while saving game" : "Failed to persist save state to storage",
        isQuota ? ErrorCode.SAVE_STORAGE_QUOTA_EXCEEDED : ErrorCode.SAVE_WRITE_FAILED,
        { cause: e }
      );
      saveLogger.error(saveError.message, saveError.toLogContext(), saveError);
      return err(saveError);
    }
  }

  /**
   * Compiles current state and safely persists it to LocalStorage, returning a typed Result.
   */
  public saveGameResult(
    players: Player[],
    enemies: Enemy[] = [],
    entities: Entity[] = [],
    levelId: string
  ): Result<SaveState, SaveError> {
    const compileRes = this.createSaveState(players, enemies, entities, levelId);
    if (!compileRes.ok) {
      return compileRes;
    }

    const state = compileRes.value;
    const persistRes = this.saveStateToStorage(state);
    if (!persistRes.ok) {
      return err(persistRes.error);
    }

    return ok(state);
  }

  /**
   * Compiles current state, attempts saving to LocalStorage, and returns the compiled state.
   * If storage write fails, returns the compiled state rather than dropping session data.
   */
  public compileSaveState(
    players: Player[],
    enemies: Enemy[] = [],
    entities: Entity[] = [],
    levelId: string
  ): SaveState {
    const compileRes = this.createSaveState(players, enemies, entities, levelId);
    if (compileRes.ok) {
      this.saveStateToStorage(compileRes.value);
      return compileRes.value;
    }

    // Fallback if player1 was not found in players
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

  /**
   * Validates and parses raw JSON string into a structured SaveState (DRY principle).
   */
  public parseSaveJson(rawJson: string): Result<SaveState, SaveError> {
    if (!rawJson || typeof rawJson !== "string") {
      return err(
        new SaveError("Save input must be a non-empty string", ErrorCode.SAVE_CORRUPTED_JSON)
      );
    }

    try {
      const parsed = JSON.parse(rawJson) as Partial<SaveState>;
      if (!parsed || typeof parsed !== "object") {
        return err(
          new SaveError("Save data must decode to a valid JSON object", ErrorCode.SAVE_CORRUPTED_JSON)
        );
      }

      const hasValidHealth = typeof parsed.p1Health === "number" && Number.isFinite(parsed.p1Health);
      const hasValidCoords =
        typeof parsed.checkpointX === "number" &&
        Number.isFinite(parsed.checkpointX) &&
        typeof parsed.checkpointY === "number" &&
        Number.isFinite(parsed.checkpointY);
      const hasValidLevel = typeof parsed.levelId === "string" && parsed.levelId.trim().length > 0;

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
        p1Mana: typeof parsed.p1Mana === "number" && Number.isFinite(parsed.p1Mana) ? parsed.p1Mana : 100,
        p1Stamina: typeof parsed.p1Stamina === "number" && Number.isFinite(parsed.p1Stamina) ? parsed.p1Stamina : 100,
        p1Score: typeof parsed.p1Score === "number" && Number.isFinite(parsed.p1Score) ? parsed.p1Score : 0,
        p1SkillPoints: typeof parsed.p1SkillPoints === "number" && Number.isFinite(parsed.p1SkillPoints) ? parsed.p1SkillPoints : 0,
        p1UnlockedSkills: Array.isArray(parsed.p1UnlockedSkills) ? parsed.p1UnlockedSkills : [],
        p1PrimarySpellId: parsed.p1PrimarySpellId,
        p1SecondarySpellId: parsed.p1SecondarySpellId,
        p1Inventory: parsed.p1Inventory,
        p2Health: typeof parsed.p2Health === "number" && Number.isFinite(parsed.p2Health) ? parsed.p2Health : 0,
        p2Mana: typeof parsed.p2Mana === "number" && Number.isFinite(parsed.p2Mana) ? parsed.p2Mana : 0,
        p2Stamina: typeof parsed.p2Stamina === "number" && Number.isFinite(parsed.p2Stamina) ? parsed.p2Stamina : 0,
        p2Score: typeof parsed.p2Score === "number" && Number.isFinite(parsed.p2Score) ? parsed.p2Score : 0,
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

  /**
   * Loads and validates SaveState from LocalStorage, returning a typed Result.
   */
  public loadSaveResult(): Result<SaveState, SaveError> {
    const storage = this.getStorage();
    if (!storage) {
      return err(new SaveError("Storage environment unavailable", ErrorCode.SAVE_WRITE_FAILED));
    }

    let data: string | null = null;
    try {
      data = storage.getItem(this.storageKey);
    } catch (cause) {
      const storageErr = new SaveError(
        "Failed to read save from storage",
        ErrorCode.SAVE_WRITE_FAILED,
        { cause }
      );
      saveLogger.error(storageErr.message, storageErr.toLogContext(), storageErr);
      return err(storageErr);
    }

    if (!data) {
      return err(new SaveError("Save slot is empty", ErrorCode.SAVE_SLOT_EMPTY));
    }

    const parseResult = this.parseSaveJson(data);
    if (!parseResult.ok) {
      saveLogger.error("Failed to parse LocalStorage save:", parseResult.error.toLogContext(), parseResult.error);
      return parseResult;
    }

    return parseResult;
  }

  /**
   * Loads from LocalStorage if available (backwards-compatible wrapper).
   */
  public loadFromLocalStorage(): SaveState | null {
    const res = this.loadSaveResult();
    return res.ok ? res.value : null;
  }

  /**
   * Clears the current save slot in storage.
   */
  public clearSave(): Result<true, SaveError> {
    const storage = this.getStorage();
    if (!storage) {
      return err(new SaveError("Storage environment unavailable", ErrorCode.SAVE_WRITE_FAILED));
    }
    try {
      storage.removeItem(this.storageKey);
      return ok(true);
    } catch (e) {
      return err(new SaveError("Failed to remove save from storage", ErrorCode.SAVE_WRITE_FAILED, { cause: e }));
    }
  }

  /**
   * Triggers a browser file download containing the compiled SaveState in pure JSON format.
   */
  public exportToFile(state: SaveState, filename?: string): Result<true, SaveError> {
    try {
      if (typeof document === "undefined" || typeof URL === "undefined" || typeof Blob === "undefined") {
        return err(
          new SaveError("DOM/File API unavailable for file export", ErrorCode.SAVE_WRITE_FAILED)
        );
      }

      const jsonStr = JSON.stringify(state, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `vibrant_castle_save_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      gameAudio.playSFX(SoundType.SFX_SAVE);
      return ok(true);
    } catch (errCause) {
      const exportError = new SaveError("Failed to trigger file download", ErrorCode.SAVE_WRITE_FAILED, {
        cause: errCause,
      });
      saveLogger.error(exportError.message, exportError.toLogContext(), exportError);
      return err(exportError);
    }
  }

  /**
   * Decodes a loaded SaveState and applies it to active game structures, returning a typed Result.
   */
  public applySaveStateResult(
    state: SaveState,
    players: Player[],
    enemies: Enemy[] = [],
    entities: Entity[] = []
  ): Result<true, SaveError> {
    if (!state || typeof state !== "object") {
      return err(
        new SaveError("Cannot apply invalid save state object", ErrorCode.SAVE_CORRUPTED_JSON)
      );
    }
    if (!Array.isArray(players)) {
      return err(
        new SaveError("Cannot apply save: Invalid players list", ErrorCode.SAVE_WRITE_FAILED)
      );
    }
    const p1 = players.find((p) => p && p.id === "player1");
    if (!p1) {
      return err(
        new SaveError("Cannot apply save: Player 1 not found in session", ErrorCode.SAVE_WRITE_FAILED)
      );
    }

    try {
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
          saveLogger.warn("Failed to load stats from save state", undefined, e);
        }
      }

      return ok(true);
    } catch (e) {
      const error = new SaveError("Failed to apply save state to active game entities", ErrorCode.SAVE_WRITE_FAILED, { cause: e });
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }
  }

  /**
   * Decodes a loaded JSON string, validates it, and applies it to active game structures (backwards-compatible wrapper).
   */
  public applySaveState(
    state: SaveState,
    players: Player[],
    enemies: Enemy[] = [],
    entities: Entity[] = []
  ): boolean {
    return this.applySaveStateResult(state, players, enemies, entities).ok;
  }
}

export const gameSave = new GameSaveSystem();
export default gameSave;
