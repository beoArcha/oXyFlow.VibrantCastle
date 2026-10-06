import { SaveState, Player, Enemy, Entity } from "@game/types";
import { Result, SaveError } from "@lib/errors";
import {
  ISaveStorage,
  ISaveValidator,
  ISaveCompiler,
  ISaveApplicator,
  ISaveExporter,
} from "./saveTypes";
import { SaveValidator, defaultSaveValidator } from "./saveValidator";
import { SaveCompiler, defaultSaveCompiler } from "./saveCompiler";
import { SaveApplicator, defaultSaveApplicator } from "./saveApplicator";
import { SaveStorage } from "./saveStorage";
import { SaveExporter, defaultSaveExporter } from "./saveExporter";

export interface GameSaveSystemDependencies {
  validator?: ISaveValidator;
  compiler?: ISaveCompiler;
  applicator?: ISaveApplicator;
  exporter?: ISaveExporter;
  customStorage?: () => ISaveStorage | null;
}

/**
 * Unified coordinator for the save and persistence subsystem.
 * Coordinates validation, compilation, entity application, storage, and file export.
 */
export class GameSaveSystem {
  private readonly validator: ISaveValidator;
  private readonly compiler: ISaveCompiler;
  private readonly applicator: ISaveApplicator;
  private readonly storage: SaveStorage;
  private readonly exporter: ISaveExporter;

  constructor(
    storageKey: string = "vibrant_castle_save_state",
    depsOrStorage?: (() => ISaveStorage | null) | GameSaveSystemDependencies
  ) {
    let deps: GameSaveSystemDependencies = {};
    if (typeof depsOrStorage === "function") {
      deps = { customStorage: depsOrStorage };
    } else if (depsOrStorage && typeof depsOrStorage === "object") {
      deps = depsOrStorage;
    }

    this.validator = deps.validator || defaultSaveValidator;
    this.compiler = deps.compiler || defaultSaveCompiler;
    this.applicator = deps.applicator || defaultSaveApplicator;
    this.exporter = deps.exporter || defaultSaveExporter;
    this.storage = new SaveStorage(storageKey, deps.customStorage, this.validator);
  }

  public getStorageKey(): string {
    return this.storage.getStorageKey();
  }

  /**
   * Compiles active game session state into a SaveState structure.
   */
  public createSaveState(
    players: Player[],
    enemies: Enemy[] = [],
    entities: Entity[] = [],
    levelId: string = "courtyard"
  ): Result<SaveState, SaveError> {
    return this.compiler.createSaveState(players, enemies, entities, levelId);
  }

  /**
   * Compiles current state and safely persists it to storage, returning a typed Result.
   */
  public saveGameResult(
    players: Player[],
    enemies: Enemy[] = [],
    entities: Entity[] = [],
    levelId: string = "courtyard"
  ): Result<SaveState, SaveError> {
    const compileRes = this.compiler.createSaveState(players, enemies, entities, levelId);
    if (!compileRes.ok) {
      return compileRes;
    }

    const state = compileRes.value;
    const persistRes = this.storage.saveStateToStorage(state);
    if (!persistRes.ok) {
      return persistRes as Result<never, SaveError>;
    }

    return compileRes;
  }

  /**
   * Compiles current state, attempts saving to storage, and returns the compiled state.
   */
  public compileSaveState(
    players: Player[],
    enemies: Enemy[] = [],
    entities: Entity[] = [],
    levelId: string = "courtyard"
  ): SaveState {
    const state = this.compiler.compileSaveState(players, enemies, entities, levelId);
    this.storage.saveStateToStorage(state);
    return state;
  }

  /**
   * Persists an existing SaveState object directly to storage.
   */
  public saveStateToStorage(state: SaveState): Result<true, SaveError> {
    return this.storage.saveStateToStorage(state);
  }

  /**
   * Validates and parses raw JSON string into a structured SaveState (DRY principle).
   */
  public parseSaveJson(rawJson: string): Result<SaveState, SaveError> {
    return this.validator.parseSaveJson(rawJson);
  }

  /**
   * Loads and validates SaveState from storage, returning a typed Result.
   */
  public loadSaveResult(): Result<SaveState, SaveError> {
    return this.storage.loadSaveResult();
  }

  /**
   * Loads from storage if available (backwards-compatible wrapper).
   */
  public loadFromLocalStorage(): SaveState | null {
    const res = this.loadSaveResult();
    return res.ok ? res.value : null;
  }

  /**
   * Clears the current save slot in storage.
   */
  public clearSave(): Result<true, SaveError> {
    return this.storage.clearSave();
  }

  /**
   * Triggers a browser file download containing the compiled SaveState in pure JSON format.
   */
  public exportToFile(state: SaveState, filename?: string): Result<true, SaveError> {
    return this.exporter.exportToFile(state, filename);
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
    return this.applicator.applySaveState(state, players, enemies, entities);
  }

  /**
   * Decodes a loaded SaveState and applies it to active game structures (backwards-compatible boolean wrapper).
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
