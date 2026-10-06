import { SaveState, Player, Enemy, Entity } from "@game/types";
import { Result, SaveError } from "@lib/errors";

/**
 * Storage abstraction interface for game saves.
 * Allows plugging custom memory stores, indexedDB, or mock storages for tests.
 */
export interface ISaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Contract for validating and parsing raw JSON strings into structured SaveState.
 */
export interface ISaveValidator {
  parseSaveJson(rawJson: string): Result<SaveState, SaveError>;
}

/**
 * Contract for compiling active game session entities into pure SaveState DTO.
 */
export interface ISaveCompiler {
  createSaveState(
    players: Player[],
    enemies?: Enemy[],
    entities?: Entity[],
    levelId?: string
  ): Result<SaveState, SaveError>;

  compileSaveState(
    players: Player[],
    enemies?: Enemy[],
    entities?: Entity[],
    levelId?: string
  ): SaveState;
}

/**
 * Contract for applying loaded SaveState onto live game session entities.
 */
export interface ISaveApplicator {
  applySaveState(
    state: SaveState,
    players: Player[],
    enemies?: Enemy[],
    entities?: Entity[]
  ): Result<true, SaveError>;
}

/**
 * Contract for exporting SaveState to file downloads in the browser environment.
 */
export interface ISaveExporter {
  exportToFile(state: SaveState, filename?: string): Result<true, SaveError>;
}
