import { Player, Enemy, Entity, SaveState } from "@game/types";
import { LocationId, LOCATION_REGISTRY } from "../locations";
import { gameSave } from "../logic/save";

export interface IEngineSaveContext {
  getPlayers(): Player[];
  getEnemies(): Enemy[];
  getEntities(): Entity[];
  getCurrentLocationId(): LocationId;
  setCurrentLocationId(id: LocationId): void;
  resetLevel(locationId: LocationId): void;
  setIsTwoPlayer(enabled: boolean): void;
  setDefeat(val: boolean): void;
  setVictory(val: boolean): void;
  triggerNarration(key: string): void;
  notifyStateChanged(): void;
  saveManager?: typeof gameSave;
}

/**
 * Coordinates game state snapshotting, persistence serialization, and world restoration.
 */
export class EngineSaveController {
  private readonly save: typeof gameSave;

  constructor(private readonly context: IEngineSaveContext) {
    this.save = context.saveManager || gameSave;
  }

  public createSaveSnapshot(): SaveState {
    return this.save.compileSaveState(
      this.context.getPlayers(),
      this.context.getEnemies(),
      this.context.getEntities(),
      this.context.getCurrentLocationId()
    );
  }

  public restoreFromSnapshot(state: SaveState): boolean {
    if (state.levelId && state.levelId in LOCATION_REGISTRY) {
      this.context.setCurrentLocationId(state.levelId as LocationId);
    }
    this.context.resetLevel(this.context.getCurrentLocationId());

    const success = this.save.applySaveState(
      state,
      this.context.getPlayers(),
      this.context.getEnemies(),
      this.context.getEntities()
    );

    if (success) {
      const hasP2InSave = state.p2Health > 0;
      this.context.setIsTwoPlayer(hasP2InSave);
      this.context.setDefeat(false);
      this.context.setVictory(false);
      this.context.notifyStateChanged();
      return true;
    }

    return false;
  }

  public saveGame(): void {
    const state = this.createSaveSnapshot();
    this.save.exportToFile(state);
    this.context.triggerNarration("saveSuccess");
    this.context.notifyStateChanged();
  }

  public loadGame(stateFromFile?: SaveState): boolean {
    const state = stateFromFile || this.save.loadFromLocalStorage();
    if (!state) {
      this.context.triggerNarration("noSaveFound");
      return false;
    }

    const success = this.restoreFromSnapshot(state);
    if (success) {
      this.context.triggerNarration("loadSuccess");
    }
    return success;
  }
}
