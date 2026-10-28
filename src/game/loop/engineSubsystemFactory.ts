import { IGameDependencies } from "./types";
import { EngineSettingsController } from "./engineSettingsController";
import { DebugCheatsController, IDebugCheatsContext } from "../debug/debugCheatsController";
import { PlayerCommandController, IPlayerCommandController } from "../controllers/playerCommandController";
import { LevelLifecycleManager, ILevelLifecycleManager } from "../locations/levelLifecycleManager";
import { EngineSaveController } from "./engineSaveController";
import { EnginePlayerUpdateStep } from "./enginePlayerUpdateStep";
import { EngineSimulationStep } from "./engineSimulationStep";
import { EngineLoopRunner } from "./engineLoopRunner";
import { createDebugCheatsContext, createLevelLifecycleContext, IEngineContextHost } from "./engineContextFactory";
import { PlayerId, Projectile } from "@game/types";
import { LocationId, LocationDefinition } from "../locations";
import { GameAudioEngine } from "@game/engine/audioEngine";
import { GameInputEngine } from "./input";
import { GamePhysicsEngine } from "../physics/physics";
import { ICollisionEngine } from "../physics/collisions";
import { ICombatSystem } from "../engine/combatSystem";
import { IEnemyAISystem } from "../engine/enemyAISystem";
import { INarrationSystem } from "../engine/narrationSystem";
import { IPlayerController } from "../engine/playerController";
import { IEnvironmentCollisionSystem } from "../physics/environmentCollisionSystem";
import { GameEventBus } from "../engine/eventBus";
import { ILogger } from "@/lib/logger";

export interface IEngineSubsystemHost extends IEngineContextHost {
  audio: GameAudioEngine;
  inputs: GameInputEngine;
  physics: GamePhysicsEngine;
  collisions: ICollisionEngine;
  combatSystem: ICombatSystem;
  enemyAISystem: IEnemyAISystem;
  narrationSystem: INarrationSystem;
  playerController: IPlayerController;
  environmentCollisionSystem: IEnvironmentCollisionSystem;
  projectiles: Projectile[];
  currentLocationId: LocationId;
  currentLocation: LocationDefinition;
  portalCooldownTimer: number;
  engineLogger: ILogger;
  eventBus: GameEventBus;
  isPaused: boolean;
  setDefaultPrimaryCharacter(characterId: "valen" | "aurelia"): void;
  setTwoPlayerMode(enabled: boolean, preserveStats?: boolean): void;
  resetLevel(locationId?: LocationId): void;
  fixedUpdate(mult: number): void;
  renderFrame(alpha: number): void;
  usePlayerPotion(pIdx: number, sIdx: number): boolean;
}

export interface IEngineControllers {
  settingsController: EngineSettingsController;
  debugCheats: DebugCheatsController;
  playerCommandController: IPlayerCommandController;
  levelLifecycleManager: ILevelLifecycleManager;
  saveController: EngineSaveController;
  playerUpdateStep: EnginePlayerUpdateStep;
  simulationStep: EngineSimulationStep;
  loopRunner: EngineLoopRunner;
}

/**
 * Initializes and wires sub-controllers for GameEngine without any type casting.
 */
export function createEngineControllers(
  host: IEngineSubsystemHost,
  deps: IGameDependencies,
  circuitBreaker: { execute: (op: string, fn: () => void) => boolean }
): IEngineControllers {
  const settingsController = new EngineSettingsController({
    audio: host.audio,
    narration: host.narrationSystem,
    onHardwareAccelerationChanged: (enabled) => host.getRenderer()?.setHardwareAcceleration(enabled),
    onTwoPlayerChanged: (enabled) => host.setTwoPlayerMode(enabled, true),
    onPrimaryCharacterChanged: (charId) => host.setDefaultPrimaryCharacter(charId),
    getPlayerCount: () => host.players.length,
    notifyStateChanged: () => host.notifyReact(),
  });

  const debugCheats =
    deps.debugCheats ||
    new DebugCheatsController(createDebugCheatsContext(host));

  const playerCommandController =
    deps.playerCommands ||
    new PlayerCommandController({
      getPlayers: () => host.players,
      notifyStateChanged: () => host.notifyReact(),
      eventBus: host.eventBus,
    });

  const levelCtx = createLevelLifecycleContext(host);
  levelCtx.clearProjectiles = () => { host.projectiles = []; };
  const levelLifecycleManager = deps.levelManager || new LevelLifecycleManager(levelCtx);

  const saveController = new EngineSaveController({
    getPlayers: () => host.players,
    getEnemies: () => host.enemies,
    getEntities: () => host.entities,
    getCurrentLocationId: () => host.currentLocationId,
    setCurrentLocationId: (id) => { host.currentLocationId = id; },
    resetLevel: (id) => host.resetLevel(id),
    setIsTwoPlayer: (val) => { host.settings.isTwoPlayer = val; },
    setDefeat: (d) => { host.isDefeat = d; },
    setVictory: (v) => { host.isVictory = v; },
    triggerNarration: (key) => host.triggerNarration(key),
    notifyStateChanged: () => host.notifyReact(),
    saveManager: deps.saveManager,
  });

  const playerUpdateStep = new EnginePlayerUpdateStep({
    getInputs: (id) => host.inputs.getInputs(id as PlayerId),
    getPhysics: () => host.physics,
    getPlayerController: () => host.playerController,
    getAudio: () => host.audio,
    particleSystem: host.particleSystem,
    getLevelDimensions: () => ({ width: host.levelWidth, height: host.levelHeight }),
    getSpawnPoint: () => host.spawnPoint,
    triggerNarration: (key) => host.triggerNarration(key),
    setDefeat: (d) => { host.isDefeat = d; },
    notifyReact: () => host.notifyReact(),
    pushProjectiles: (proj) => { host.projectiles.push(...proj); },
    usePlayerPotion: (pIdx, sIdx) => host.usePlayerPotion(pIdx, sIdx),
  });

  const simulationStep = new EngineSimulationStep({
    getPlayers: () => host.players,
    getEnemies: () => host.enemies,
    getEntities: () => host.entities,
    getProjectiles: () => host.projectiles,
    setProjectiles: (proj) => { host.projectiles = proj; },
    combatSystem: host.combatSystem,
    physics: host.physics,
    cameraManager: host.cameraManager,
    particleSystem: host.particleSystem,
    collisions: host.collisions,
    audio: host.audio,
    enemyAISystem: host.enemyAISystem,
    environmentCollisionSystem: host.environmentCollisionSystem,
    levelLifecycleManager: levelLifecycleManager,
    narrationSystem: host.narrationSystem,
    getLevelDimensions: () => ({ width: host.levelWidth, height: host.levelHeight }),
    getPortalCooldownTimer: () => host.portalCooldownTimer,
    getCurrentLocation: () => host.currentLocation,
    triggerNarration: (key) => host.triggerNarration(key),
    notifyReact: () => host.notifyReact(),
  });

  const loopRunner = new EngineLoopRunner({
    getTargetFps: () => host.settings.display.targetFps || 60,
    onLoopStart: () => {
      host.audio.init();
      host.audio.setMusicIntensity(host.currentLocation?.theme.musicIntensity || 0.1);
    },
    onLoopStop: () => host.audio.stopBGM(),
    fixedUpdate: (mult) => host.fixedUpdate(mult),
    renderFrame: (alpha) => host.renderFrame(alpha),
    executeProtected: (op, action) => circuitBreaker.execute(op, action),
    notifyStateChanged: () => {
      host.eventBus.emit("STATE_SNAPSHOT", {
        isPaused: host.isPaused,
        isVictory: host.isVictory,
        isDefeat: host.isDefeat,
      });
      host.notifyReact();
    },
    logger: host.engineLogger,
  });

  return {
    settingsController,
    debugCheats,
    playerCommandController,
    levelLifecycleManager,
    saveController,
    playerUpdateStep,
    simulationStep,
    loopRunner,
  };
}
