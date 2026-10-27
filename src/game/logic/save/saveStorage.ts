import { SaveState } from "@game/types";
import { saveLogger } from "@game/logger/gameLogger";
import { Result, ok, err, SaveError, ErrorCode } from "@lib/errors";
import { ISaveStorage, ISaveValidator } from "./saveTypes";
import { defaultSaveValidator } from "./saveValidator";

/**
 * Encapsulates low-level persistence operations with browser/runtime storage (SRP & DIP).
 */
export class SaveStorage {
  private readonly storageKey: string;
  private readonly customStorage?: () => ISaveStorage | null;
  private readonly validator: ISaveValidator;

  constructor(
    storageKey: string = "vibrant_castle_save_state",
    customStorage?: () => ISaveStorage | null,
    validator: ISaveValidator = defaultSaveValidator
  ) {
    this.storageKey = storageKey;
    this.customStorage = customStorage;
    this.validator = validator;
  }

  /**
   * Safely acquires browser/runtime storage instance with fallback for tests and Node/Bun.
   */
  public getStorage(): ISaveStorage | null {
    if (this.customStorage) {
      try {
        const custom = this.customStorage();
        if (custom) return custom;
      } catch (err: unknown) {
        saveLogger.warn("Custom storage resolution failed, falling back to runtime detection", undefined, err);
      }
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      const glob = globalThis as unknown as Record<string, unknown>;
      if (glob.localStorage) {
        return glob.localStorage as unknown as ISaveStorage;
      }
    }
    return null;
  }

  public getStorageKey(): string {
    return this.storageKey;
  }

  /**
   * Persists an existing SaveState object directly to storage.
   */
  public saveStateToStorage(state: SaveState): Result<true, SaveError> {
    const storage = this.getStorage();
    if (!storage) {
      const error = new SaveError("Storage environment unavailable", ErrorCode.SAVE_WRITE_FAILED, {
        details: { storageKey: this.storageKey },
      });
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }

    try {
      storage.setItem(this.storageKey, JSON.stringify(state));
      return ok(true);
    } catch (e: unknown) {
      const isQuota =
        typeof e === "object" &&
        e !== null &&
        (("name" in e && e.name === "QuotaExceededError") || ("code" in e && e.code === 22));
      const saveError = new SaveError(
        isQuota ? "Storage quota exceeded while saving game" : "Failed to persist save state to storage",
        isQuota ? ErrorCode.SAVE_STORAGE_QUOTA_EXCEEDED : ErrorCode.SAVE_WRITE_FAILED,
        {
          cause: e,
          details: { storageKey: this.storageKey, isQuota },
        }
      );
      saveLogger.error(saveError.message, saveError.toLogContext(), saveError);
      return err(saveError);
    }
  }

  /**
   * Loads and validates SaveState from storage, returning a typed Result.
   */
  public loadSaveResult(): Result<SaveState, SaveError> {
    const storage = this.getStorage();
    if (!storage) {
      const error = new SaveError("Storage environment unavailable", ErrorCode.SAVE_WRITE_FAILED, {
        details: { storageKey: this.storageKey },
      });
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }

    let data: string | null = null;
    try {
      data = storage.getItem(this.storageKey);
    } catch (cause) {
      const storageErr = new SaveError(
        "Failed to read save from storage",
        ErrorCode.SAVE_WRITE_FAILED,
        {
          cause,
          details: { storageKey: this.storageKey },
        }
      );
      saveLogger.error(storageErr.message, storageErr.toLogContext(), storageErr);
      return err(storageErr);
    }

    if (!data) {
      const error = new SaveError("Save slot is empty", ErrorCode.SAVE_SLOT_EMPTY, {
        details: { storageKey: this.storageKey },
      });
      saveLogger.info(error.message, error.toLogContext());
      return err(error);
    }

    const parseResult = this.validator.parseSaveJson(data);
    if (!parseResult.ok) {
      saveLogger.error(
        "Failed to parse LocalStorage save:",
        parseResult.error.toLogContext(),
        parseResult.error
      );
      return parseResult;
    }

    return parseResult;
  }

  /**
   * Clears the configured save slot in storage.
   */
  public clearSave(): Result<true, SaveError> {
    const storage = this.getStorage();
    if (!storage) {
      const error = new SaveError("Storage environment unavailable", ErrorCode.SAVE_WRITE_FAILED, {
        details: { storageKey: this.storageKey },
      });
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }
    try {
      storage.removeItem(this.storageKey);
      return ok(true);
    } catch (e) {
      const error = new SaveError("Failed to remove save from storage", ErrorCode.SAVE_WRITE_FAILED, {
        cause: e,
        details: { storageKey: this.storageKey },
      });
      saveLogger.error(error.message, error.toLogContext(), error);
      return err(error);
    }
  }
}
