import {
  Player,
  Enemy,
  Entity,
  CollisionType,
  SoundType,
  ParticleBurstType,
  PlayerId,
} from "../types";
import { LocationId, LocationDefinition, getLocation, getNextLocation } from "./index";
import { LevelDesigner } from "./levels";
import { statsManager } from "../logic/stats";

/**
 * Context interface provided by GameEngine to LevelLifecycleManager.
 * Allows level lifecycle operations without hard coupling to engine internals.
 */
export interface ILevelLifecycleContext {
  getPlayers(): Player[];
  setPlayers(players: Player[]): void;
  getEnemies(): Enemy[];
  setEnemies(enemies: Enemy[]): void;
  getEntities(): Entity[];
  setEntities(entities: Entity[]): void;
  clearProjectiles(): void;
  getIsTwoPlayer(): boolean;
  setIsTwoPlayer(enabled: boolean): void;
  getViewportSize(): { width: number; height: number };
  snapCamera(players: Player[], levelWidth: number, levelHeight: number): void;
  triggerNarration(key: string): void;
  resetNarration(): void;
  playSFX(type: SoundType): void;
  setMusicIntensity(intensity: number): void;
  spawnBurst(x: number, y: number, color: string, type: ParticleBurstType, count: number): void;
  stopEngine(): void;
  startEngine(): void;
  isRunning(): boolean;
  notifyReact(): void;
}

/**
 * Interface contract for Level Lifecycle management.
 */
export interface ILevelLifecycleManager {
  currentLocationId: LocationId;
  currentLocation: LocationDefinition;
  levelWidth: number;
  levelHeight: number;
  spawnPoint: { x: number; y: number };
  isVictory: boolean;
  isDefeat: boolean;
  isLevelTransitionPending: boolean;
  portalCooldownTimer: number;

  loadLocation(
    locationId: LocationId,
    targetSpawnPoint?: { x: number; y: number },
    preservePlayerStats?: boolean
  ): void;

  resetLevel(
    locationId?: LocationId,
    customSpawnPoint?: { x: number; y: number },
    preservePlayerStats?: boolean,
    p1CharacterId?: "valen" | "aurelia"
  ): void;

  setTwoPlayerMode(enabled: boolean, preserveStats?: boolean): void;

  advanceToNextLocation(): void;

  handleLeverUnlocks(triggerId: string): void;

  handleGoalCompletion(portalEntity?: Entity): void;

  decrementCooldowns(): void;

  consumeLevelTransitionPending(): boolean;
}

/**
 * LevelLifecycleManager encapsulates level loading, state transitions,
 * portal teleportation, lever gates, and two-player spawn positioning.
 */
export class LevelLifecycleManager implements ILevelLifecycleManager {
  public currentLocationId: LocationId = "courtyard";
  public currentLocation: LocationDefinition = getLocation("courtyard");
  public levelWidth: number = 2400;
  public levelHeight: number = 800;
  public spawnPoint: { x: number; y: number } = { x: 100, y: 400 };
  public isVictory: boolean = false;
  public isDefeat: boolean = false;
  public isLevelTransitionPending: boolean = false;
  public portalCooldownTimer: number = 0;

  constructor(private readonly context: ILevelLifecycleContext) {}

  public loadLocation(
    locationId: LocationId,
    targetSpawnPoint?: { x: number; y: number },
    preservePlayerStats: boolean = true
  ): void {
    this.currentLocationId = locationId;
    this.resetLevel(locationId, targetSpawnPoint, preservePlayerStats);
    if (!this.context.isRunning()) {
      this.context.startEngine();
    }
  }

  public resetLevel(
    locationId?: LocationId,
    customSpawnPoint?: { x: number; y: number },
    preservePlayerStats: boolean = false,
    p1CharacterId: "valen" | "aurelia" = "valen"
  ): void {
    if (locationId) {
      this.currentLocationId = locationId;
    }
    const targetLocId = this.currentLocationId || "courtyard";
    const data = LevelDesigner.createLocationState(
      targetLocId,
      this.context.getIsTwoPlayer(),
      customSpawnPoint,
      preservePlayerStats ? this.context.getPlayers() : undefined,
      p1CharacterId
    );

    this.context.setPlayers(data.players);
    this.context.setEnemies(data.enemies);
    this.context.setEntities(data.entities);
    this.context.clearProjectiles();

    this.levelWidth = data.levelWidth;
    this.levelHeight = data.levelHeight;
    this.spawnPoint = data.spawnPoint;
    this.currentLocation = data.location;

    // Explicitly maintain engine settings in sync with active player session
    this.context.setIsTwoPlayer(data.players.length > 1);

    this.isVictory = false;
    this.isDefeat = false;
    this.isLevelTransitionPending = false;
    this.portalCooldownTimer = 45;
    this.context.resetNarration();

    this.context.snapCamera(data.players, this.levelWidth, this.levelHeight);

    this.context.triggerNarration(this.currentLocation.openingNarrationKey || "narrationOpening");
    this.context.setMusicIntensity(this.currentLocation.theme.musicIntensity);
    this.context.notifyReact();
  }

  public setTwoPlayerMode(enabled: boolean, preserveStats: boolean = true): void {
    this.context.setIsTwoPlayer(enabled);
    const players = this.context.getPlayers();
    if (preserveStats && players && players.length > 0) {
      if (enabled && players.length === 1) {
        const p1 = players[0];
        const p2Offset = this.currentLocation?.p2SpawnOffset || { x: 40, y: 0 };
        const p2X = Math.max(0, Math.min(this.levelWidth - 32, p1.x + p2Offset.x));
        const p2Y = p1.y;
        const p1CharacterId = p1.characterId || "valen";
        const p2CharacterId: "valen" | "aurelia" = p1CharacterId === "valen" ? "aurelia" : "valen";
        players.push(LevelDesigner.createPlayerEntity(PlayerId.Player2, p2CharacterId, p2X, p2Y));
      } else if (!enabled && players.length > 1) {
        this.context.setPlayers([players[0]]);
      }
      this.context.notifyReact();
    } else {
      this.resetLevel(undefined, undefined, preserveStats);
    }
  }

  public advanceToNextLocation(): void {
    const nextLoc = getNextLocation(this.currentLocationId);
    this.loadLocation(nextLoc.id, undefined, true);
    if (!this.context.isRunning()) {
      this.context.startEngine();
    }
    this.context.notifyReact();
  }

  public handleLeverUnlocks(triggerId: string): void {
    statsManager.recordLeverPulled();
    const entities = this.context.getEntities();
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      // Check if entity is a gate or wall in this location
      if (
        entity.type === CollisionType.Solid &&
        (entity.id.includes("gate") || entity.id.includes("wall") || entity.id === "grand_gate")
      ) {
        entity.y = -1000; // lift gate out of collision
        this.context.playSFX(SoundType.SFX_UNLOCK);
        this.context.triggerNarration("trainingLeverSuccess");

        this.context.spawnBurst(entity.x + entity.width / 2, 300, "#e2b653", "dust", 20);
      }
    }
    this.context.notifyReact();
  }

  public handleGoalCompletion(portalEntity?: Entity): void {
    statsManager.recordLevelCompleted();
    this.context.playSFX(SoundType.SFX_SAVE);

    // If portal specifies targetLocationId, transition seamlessly across the interconnected location network!
    const targetLocId = (portalEntity?.targetLocationId || this.currentLocation?.nextLocationId) as
      | LocationId
      | undefined;
    const targetSpawn = portalEntity?.targetSpawnPoint;

    // Conquering Grand Bastion mastery portal rewards victory screen!
    if (
      this.currentLocationId === "grand_bastion" &&
      (portalEntity?.id === "grand_portal" || !targetLocId || targetLocId === "courtyard")
    ) {
      if (portalEntity) {
        this.context.spawnBurst(
          portalEntity.x + portalEntity.width / 2,
          portalEntity.y + portalEntity.height / 2,
          "#f59e0b",
          "magic",
          35
        );
      }
      this.isVictory = true;
      this.context.triggerNarration("trainingGoalSuccess");
      this.context.stopEngine();
      this.context.notifyReact();
      return;
    }

    if (targetLocId && targetLocId !== this.currentLocationId) {
      if (portalEntity) {
        const pColor = portalEntity.portalColors?.outer || "#06b6d4";
        const pEffect =
          portalEntity.particleEffect === "dust" || portalEntity.particleEffect === "spark"
            ? portalEntity.particleEffect
            : "magic";
        this.context.spawnBurst(
          portalEntity.x + portalEntity.width / 2,
          portalEntity.y + portalEntity.height / 2,
          pColor,
          pEffect,
          30
        );
      }
      this.loadLocation(targetLocId, targetSpawn, true);
      this.isLevelTransitionPending = true;
      this.portalCooldownTimer = 45;
      this.context.notifyReact();
      return;
    }

    // Final victory if no further location
    this.isVictory = true;
    this.context.triggerNarration("trainingGoalSuccess");
    this.context.stopEngine();
    this.context.notifyReact();
  }

  public decrementCooldowns(): void {
    if (this.portalCooldownTimer > 0) {
      this.portalCooldownTimer -= 1;
    }
  }

  public consumeLevelTransitionPending(): boolean {
    if (this.isLevelTransitionPending) {
      this.isLevelTransitionPending = false;
      return true;
    }
    return false;
  }
}
