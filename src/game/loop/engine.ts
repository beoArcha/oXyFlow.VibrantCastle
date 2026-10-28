import {
  Player, Enemy, Entity, SoundType, GameSettings, SaveState, Projectile,
  PlayerId, EquipmentState, SupportedLanguage, PlayerStatKey, ParticleBurstType, ScalingFilterMode,
} from "@game/types";
import { gameAudio, GameAudioEngine } from "@game/engine/audioEngine";
import { gameInputs, GameInputEngine } from "./input";
import { gamePhysics, GamePhysicsEngine } from "../physics/physics";
import { gameCollisions, ICollisionEngine } from "../physics/collisions";
import { LocationId, LocationDefinition } from "../locations";
import { ILevelLifecycleManager } from "../locations/levelLifecycleManager";
import { EnvironmentCollisionSystem, IEnvironmentCollisionSystem } from "../physics/environmentCollisionSystem";
import { GameRenderer } from "../renderer/renderer";
import { ParticleSystem } from "./../engine/particleSystem";
import { CameraManager } from "../engine/cameraManager";
import { DebugCheatsController } from "../debug/debugCheatsController";
import { IPlayerCommandController } from "../controllers/playerCommandController";
import { statsManager } from "../logic/stats";
import { TargetFps } from "../engine/fpsManager";
import { CombatSystem, ICombatSystem } from "../engine/combatSystem";
import { EnemyAISystem, IEnemyAISystem } from "../engine/enemyAISystem";
import { NarrationSystem, INarrationSystem } from "../engine/narrationSystem";
import { PlayerController, IPlayerController, defaultPlayerController } from "../engine/playerController";
import { GameEventBus, gameEventBus } from "../engine/eventBus";
import { debugManager } from "../debug/debugManager";
import { engineLogger } from "../logger/gameLogger";
import { LoopCircuitBreaker } from "./loopCircuitBreaker";
import { ILogger } from "@/lib/logger";
import { createEngineControllers, IEngineControllers, IEngineSubsystemHost } from "./engineSubsystemFactory";
import { renderEngineFrame } from "./engineFrameRenderer";
import { IGameDependencies } from "./types";

export type { IGameDependencies };

/**
 * Core Game Engine and Orchestrator Facade.
 * Coordinates State, Inputs, Physics, Collisions, Magic, Audio, and Pixel Rendering.
 */
export class GameEngine implements IEngineSubsystemHost {
  public players: Player[] = [];
  public enemies: Enemy[] = [];
  public entities: Entity[] = [];
  public projectiles: Projectile[] = [];

  public readonly eventBus: GameEventBus;
  public readonly audio: GameAudioEngine;
  public readonly inputs: GameInputEngine;
  public readonly physics: GamePhysicsEngine;
  public readonly collisions: ICollisionEngine;
  public readonly combatSystem: ICombatSystem;
  public readonly enemyAISystem: IEnemyAISystem;
  public readonly narrationSystem: INarrationSystem;
  public readonly playerController: IPlayerController;
  public readonly environmentCollisionSystem: IEnvironmentCollisionSystem;
  public readonly logger: ILogger;
  public readonly circuitBreaker: LoopCircuitBreaker;

  // Sub-controllers
  private readonly c: IEngineControllers;

  // Renderer & scene systems
  private renderer: GameRenderer | null = null;
  public readonly particleSystem: ParticleSystem = new ParticleSystem();
  public readonly cameraManager: CameraManager = new CameraManager();

  // Primary player archetype preference for new runs & level resets
  public defaultPrimaryCharacter: "valen" | "aurelia" = "valen";

  // React listener callbacks & metrics
  private readonly stateListeners: Set<() => void> = new Set();
  private uiSyncTimer: number = 0;
  public simulationTicks: number = 0;

  constructor(deps: IGameDependencies = {}) {
    this.eventBus = deps.eventBus || gameEventBus;
    this.audio = deps.audio || gameAudio;
    this.inputs = deps.inputs || gameInputs;
    this.physics = deps.physics || new GamePhysicsEngine(this.audio);
    this.collisions = deps.collisions || gameCollisions;
    this.combatSystem = deps.combat || new CombatSystem();
    this.enemyAISystem = deps.enemyAI || new EnemyAISystem();
    this.narrationSystem = deps.narration || new NarrationSystem();
    this.playerController = deps.playerController || defaultPlayerController;
    this.environmentCollisionSystem = deps.environmentCollisions || new EnvironmentCollisionSystem();
    this.logger = deps.logger || engineLogger;

    this.circuitBreaker = deps.circuitBreaker || new LoopCircuitBreaker({
      logger: this.logger,
      onTrip: () => this.setPaused(true),
    });

    this.c = createEngineControllers(this, deps, this.circuitBreaker);
    this.c.levelLifecycleManager.resetLevel("courtyard");
  }

  // --- Subsystem & State Property Accessors ---

  public get loopCircuitBreaker(): LoopCircuitBreaker { return this.circuitBreaker; }
  public get engineLogger(): ILogger { return this.logger; }
  public get debugController(): DebugCheatsController { return this.c.debugCheats; }
  public get playerCommands(): IPlayerCommandController { return this.c.playerCommandController; }
  public get level(): ILevelLifecycleManager { return this.c.levelLifecycleManager; }
  public get environmentCollisions(): IEnvironmentCollisionSystem { return this.environmentCollisionSystem; }

  public get currentLocationId(): LocationId { return this.c.levelLifecycleManager.currentLocationId; }
  public set currentLocationId(val: LocationId) { this.c.levelLifecycleManager.currentLocationId = val; }
  public get currentLocation(): LocationDefinition { return this.c.levelLifecycleManager.currentLocation; }
  public set currentLocation(val: LocationDefinition) { this.c.levelLifecycleManager.currentLocation = val; }
  public get levelWidth(): number { return this.c.levelLifecycleManager.levelWidth; }
  public set levelWidth(val: number) { this.c.levelLifecycleManager.levelWidth = val; }
  public get levelHeight(): number { return this.c.levelLifecycleManager.levelHeight; }
  public set levelHeight(val: number) { this.c.levelLifecycleManager.levelHeight = val; }
  public get spawnPoint(): { x: number; y: number } { return this.c.levelLifecycleManager.spawnPoint; }
  public set spawnPoint(val: { x: number; y: number }) { this.c.levelLifecycleManager.spawnPoint = val; }
  public get isVictory(): boolean { return this.c.levelLifecycleManager.isVictory; }
  public set isVictory(val: boolean) { this.c.levelLifecycleManager.isVictory = val; }
  public get isDefeat(): boolean { return this.c.levelLifecycleManager.isDefeat; }
  public set isDefeat(val: boolean) { this.c.levelLifecycleManager.isDefeat = val; }
  public get isLevelTransitionPending(): boolean { return this.c.levelLifecycleManager.isLevelTransitionPending; }
  public set isLevelTransitionPending(val: boolean) { this.c.levelLifecycleManager.isLevelTransitionPending = val; }
  public get portalCooldownTimer(): number { return this.c.levelLifecycleManager.portalCooldownTimer; }
  public set portalCooldownTimer(val: number) { this.c.levelLifecycleManager.portalCooldownTimer = val; }
  public get currentNarrationText(): string { return this.narrationSystem.getCurrentText(); }

  public get settings(): GameSettings { return this.c.settingsController.settings; }
  public set settings(val: GameSettings) { Object.assign(this.c.settingsController.settings, val); }

  public get isLoopRunning(): boolean { return this.c.loopRunner.running; }
  public get isRunning(): boolean { return this.c.loopRunner.running; }
  public get isPaused(): boolean { return this.c.loopRunner.paused; }
  public set isPaused(val: boolean) { this.c.loopRunner.setPaused(val); }
  public get simulationTick(): number { return this.simulationTicks; }

  // --- Loop Control & Settings ---
  public start(): void { this.c.loopRunner.start(); }
  public stop(): void { this.c.loopRunner.stop(); }
  public tick(dtMultiplier: number = 1.0): void { this.c.loopRunner.tick(dtMultiplier); }
  public stepSingleFrame(): void { this.c.loopRunner.stepSingleFrame(); }
  public setPaused(paused: boolean): void { this.c.loopRunner.setPaused(paused); }
  public togglePause(forceState?: boolean): boolean { return this.c.loopRunner.togglePause(forceState); }
  public applySettings(settings: Partial<GameSettings>): void { this.c.settingsController.applySettings(settings); }
  public setLanguage(lang: SupportedLanguage): void { this.c.settingsController.setLanguage(lang); }
  public setTargetFps(fps: TargetFps): void { this.c.settingsController.setTargetFps(fps); }
  public setShowFpsCounter(show: boolean): void { this.c.settingsController.setShowFpsCounter(show); }
  public setHardwareAcceleration(enabled: boolean): void { this.c.settingsController.setHardwareAcceleration(enabled); }

  public attachCanvas(canvas: HTMLCanvasElement): void {
    const isGpu = this.settings.display.hardwareAcceleration !== false;
    this.renderer = new GameRenderer(canvas, {}, { hardwareAcceleration: isGpu });
  }

  public setCanvasDimensions(width: number, height: number, dpr: number, filterMode: ScalingFilterMode = "pixel"): void {
    this.renderer?.setDimensions(width, height, dpr, filterMode);
  }

  public registerStateListener(cb: () => void): () => void {
    this.stateListeners.add(cb);
    return () => this.stateListeners.delete(cb);
  }

  public clearAllListeners(): void {
    this.stateListeners.clear();
    this.eventBus.clear();
  }

  public notifyReact(): void {
    this.stateListeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        this.logger.error("Error in engine state listener:", { listenerCount: this.stateListeners.size }, err);
      }
    });
  }

  public checkAndUpdateVitalsSnapshot(): boolean {
    return this.c.playerUpdateStep.checkAndUpdateVitals(this.players);
  }

  // --- Persistence & Location Transitions ---

  public createSaveSnapshot(): SaveState { return this.c.saveController.createSaveSnapshot(); }
  public restoreFromSnapshot(state: SaveState): boolean { return this.c.saveController.restoreFromSnapshot(state); }
  public saveGame(): void { this.c.saveController.saveGame(); }
  public loadGame(stateFromFile?: SaveState): void { this.c.saveController.loadGame(stateFromFile); }

  public loadLocation(locationId: LocationId, targetSpawnPoint?: { x: number; y: number }, preservePlayerStats: boolean = true): void {
    this.logger.info(`Loading location: ${locationId}`, { locationId, targetSpawnPoint, preservePlayerStats });
    this.c.levelLifecycleManager.loadLocation(locationId, targetSpawnPoint, preservePlayerStats);
    this.eventBus.emit("LOCATION_CHANGED", {
      locationId: this.currentLocationId,
      locationNameKey: this.currentLocation?.nameKey || "locationUnknown",
    });
  }

  public resetLevel(locationId?: LocationId, customSpawnPoint?: { x: number; y: number }, preservePlayerStats: boolean = false): void {
    this.c.levelLifecycleManager.resetLevel(locationId, customSpawnPoint, preservePlayerStats);
    this.eventBus.emit("LEVEL_RESET", { locationId: this.currentLocationId });
  }

  public setTwoPlayerMode(enabled: boolean, preserveStats: boolean = true): void {
    this.c.levelLifecycleManager.setTwoPlayerMode(enabled, preserveStats);
  }

  public advanceToNextLocation(): void {
    this.c.levelLifecycleManager.advanceToNextLocation();
    this.eventBus.emit("LOCATION_CHANGED", {
      locationId: this.currentLocationId,
      locationNameKey: this.currentLocation?.nameKey || "locationUnknown",
    });
  }

  public resetNarration(): void {
    this.narrationSystem.reset();
  }

  public triggerNarration(key: string): void {
    if (this.narrationSystem.trigger(key, this.settings.language)) {
      this.eventBus.emit("NARRATION_TRIGGERED", {
        textKey: key,
        text: this.narrationSystem.getCurrentText(),
      });
      this.notifyReact();
    }
  }

  // --- Fixed Simulation Step (60 Hz Fixed Timestep) ---

  public fixedUpdate(stepMultiplier: number = 1.0): void {
    const effectiveDt = stepMultiplier * (debugManager.state.timeScale || 1.0);
    this.simulationTicks += effectiveDt;

    this.c.levelLifecycleManager.decrementCooldowns();
    statsManager.addPlayTime(effectiveDt / 60);

    const anyPlayerAttacking = this.c.playerUpdateStep.updatePlayers(this.players, effectiveDt);
    this.c.simulationStep.execute(effectiveDt, stepMultiplier, anyPlayerAttacking);

    this.uiSyncTimer += stepMultiplier;
    if (this.uiSyncTimer >= 6) {
      this.uiSyncTimer = 0;
      if (this.checkAndUpdateVitalsSnapshot()) {
        this.notifyReact();
      }
    }
  }

  // --- Rendering Pass ---

  public renderFrame(interpolationAlpha: number = 1.0): void {
    renderEngineFrame(this, interpolationAlpha);
  }

  // --- Facade Delegation to DebugCheats & PlayerCommands ---

  public getRenderer(): GameRenderer | null { return this.renderer; }
  public getRendererScaleFactor(): number { return this.renderer ? this.renderer.scaleFactor : 1; }
  public setMusicIntensity(intensity: number): void { this.audio.setMusicIntensity(intensity); }
  public playSFX(type: SoundType): void { this.audio.playSFX(type); }

  public teleportPlayer(playerId: PlayerId = PlayerId.Player1, x: number, y: number): void { this.c.debugCheats.teleportPlayer(playerId, x, y); }
  public killAllEnemies(): void { this.c.debugCheats.killAllEnemies(); }
  public damageEnemy(enemyId: string, amount: number = 50): boolean { return this.c.debugCheats.damageEnemy(enemyId, amount); }
  public removeEnemy(enemyId: string): boolean { return this.c.debugCheats.removeEnemy(enemyId); }
  public spawnEnemy(enemyType: string, customX?: number, customY?: number): Enemy { return this.c.debugCheats.spawnEnemy(enemyType, customX, customY); }
  public refillVitals(playerIndex: number = 0): void { this.c.debugCheats.refillVitals(playerIndex); }
  public setPlayerStat(playerIndex: number, stat: PlayerStatKey, value: number): void { this.c.debugCheats.setPlayerStat(playerIndex, stat, value); }
  public unlockAllSkills(playerIndex: number = 0): void { this.c.debugCheats.unlockAllSkills(playerIndex); }
  public giveAllWeapons(playerIndex: number = 0): void { this.c.debugCheats.giveAllWeapons(playerIndex); }
  public givePotions(playerIndex: number = 0): void { this.c.debugCheats.givePotions(playerIndex); }
  public addGold(amount: number): void { this.c.debugCheats.addGold(amount); }
  public clearInventory(playerIndex: number = 0): void { this.c.debugCheats.clearInventory(playerIndex); }
  public triggerParticleBurst(type: ParticleBurstType, count: number = 25): void { this.c.debugCheats.triggerParticleBurst(type, count); }
  public forceVictory(): void { this.c.debugCheats.forceVictory(); }
  public forceDefeat(): void { this.c.debugCheats.forceDefeat(); }

  public equipPlayerItem(playerIndex: number, backpackIndex: number): boolean { return this.c.playerCommandController.equipPlayerItem(playerIndex, backpackIndex); }
  public unequipPlayerItem(playerIndex: number, slot: keyof EquipmentState): boolean { return this.c.playerCommandController.unequipPlayerItem(playerIndex, slot); }
  public usePlayerPotion(playerIndex: number, slotIndex: number): boolean {
    const success = this.c.playerCommandController.usePlayerPotion(playerIndex, slotIndex);
    if (success) {
      this.eventBus.emit("ITEM_CONSUMED", { playerIndex, slotIndex });
    }
    return success;
  }
  public discardPlayerItem(playerIndex: number, backpackIndex: number): boolean { return this.c.playerCommandController.discardPlayerItem(playerIndex, backpackIndex); }
  public resetPlayerInventoryToDefaults(): void { this.c.playerCommandController.resetPlayerInventoryToDefaults(); }
  public unlockPlayerSkill(playerIndex: number, nodeId: string): { success: boolean; messageKey?: string } { return this.c.playerCommandController.unlockPlayerSkill(playerIndex, nodeId); }
  public assignPlayerSpell(playerIndex: number, spellId: string, slot: "primary" | "secondary"): boolean { return this.c.playerCommandController.assignPlayerSpell(playerIndex, spellId, slot); }
  public resetPlayerSkillsToDefaults(): void { this.c.playerCommandController.resetPlayerSkillsToDefaults(); }
  public getDefaultPrimaryCharacter(): "valen" | "aurelia" { return this.defaultPrimaryCharacter; }
  public setDefaultPrimaryCharacter(characterId: "valen" | "aurelia"): void { this.defaultPrimaryCharacter = characterId; }
  public swapCharacters(): boolean {
    const success = this.c.playerCommandController.swapPlayerCharacters();
    if (success && this.players[0]) {
      this.defaultPrimaryCharacter = (this.players[0].characterId as "valen" | "aurelia") || "valen";
    }
    return success;
  }
  public setPlayerCharacter(playerIndex: number, characterId: "valen" | "aurelia"): boolean {
    const success = this.c.playerCommandController.setPlayerCharacter(playerIndex, characterId);
    if (success && playerIndex === 0) {
      this.defaultPrimaryCharacter = characterId;
    }
    return success;
  }
}

export const gameEngine = new GameEngine();
export default gameEngine;
