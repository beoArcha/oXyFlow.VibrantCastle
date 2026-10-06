import {
  Player,
  Enemy,
  Entity,
  SoundType,
  GameSettings,
  SaveState,
  Projectile,
  AssetQuality,
  PlayerId,
  EquipmentState,
} from "@game/types";
import { gameAudio, GameAudioEngine } from "@game/engine/audioEngine";
import { gameInputs, GameInputEngine } from "./input";
import { gamePhysics, GamePhysicsEngine } from "../physics/physics";
import { gameCollisions, ICollisionEngine } from "../physics/collisions";
import { LocationId, LocationDefinition, LOCATION_REGISTRY } from "../locations";
import {
  LevelLifecycleManager,
  ILevelLifecycleManager,
} from "../locations/levelLifecycleManager";
import {
  EnvironmentCollisionSystem,
  IEnvironmentCollisionSystem,
} from "../physics/environmentCollisionSystem";
import { GameRenderer } from "../renderer/renderer";
import { ParticleSystem } from "./../engine/particleSystem";
import { CameraManager } from "../engine/cameraManager";
import { gameSave } from "../logic/save";
import { attemptCastSpell } from "../logic/magic";
import { DebugCheatsController } from "../debug/debugCheatsController";
import {
  PlayerCommandController,
  IPlayerCommandController,
} from "../controllers/playerCommandController";
import { statsManager } from "../logic/stats";
import { fpsManager, TargetFps } from "../engine/fpsManager";
import { CombatSystem, ICombatSystem } from "../engine/combatSystem";
import { EnemyAISystem, IEnemyAISystem } from "../engine/enemyAISystem";
import { NarrationSystem, INarrationSystem } from "../engine/narrationSystem";
import { PlayerController, IPlayerController, defaultPlayerController } from "../engine/playerController";
import { GameEventBus, gameEventBus } from "../engine/eventBus";
import { debugManager } from "../debug/debugManager";
import defaultSettingsJson from "@data/defaults/defaultSettings.json";
import { engineLogger } from "../logger/gameLogger";
import { LoopCircuitBreaker } from "./loopCircuitBreaker";
import { ILogger } from "@/lib/logger";

/**
 * Dependency container for GameEngine (Dependency Inversion Principle - DIP).
 * Enables mocking and loose coupling for unit testing and modular extension.
 */
export interface IGameDependencies {
  audio?: GameAudioEngine;
  inputs?: GameInputEngine;
  physics?: GamePhysicsEngine;
  collisions?: ICollisionEngine;
  combat?: ICombatSystem;
  enemyAI?: IEnemyAISystem;
  narration?: INarrationSystem;
  playerController?: IPlayerController;
  saveManager?: typeof gameSave;
  debugCheats?: DebugCheatsController;
  playerCommands?: IPlayerCommandController;
  levelManager?: ILevelLifecycleManager;
  environmentCollisions?: IEnvironmentCollisionSystem;
  logger?: ILogger;
  circuitBreaker?: LoopCircuitBreaker;
  eventBus?: GameEventBus;
}

/**
 * Core Game Engine and Orchestrator.
 * Coordinates State, Inputs, Physics, Collisions, Magic/Projectiles, Synthesizer Audio, and Pixel Rendering.
 */
export class GameEngine {
  // Game state
  public players: Player[] = [];
  public enemies: Enemy[] = [];
  public entities: Entity[] = [];
  public projectiles: Projectile[] = [];

  // Domain Event Bus
  public readonly eventBus: GameEventBus;

  // Subsystems
  private readonly audio: GameAudioEngine;
  private readonly inputs: GameInputEngine;
  private readonly physics: GamePhysicsEngine;
  private readonly collisions: ICollisionEngine;
  private readonly combatSystem: ICombatSystem;
  private readonly enemyAISystem: IEnemyAISystem;
  private readonly narrationSystem: INarrationSystem;
  private readonly playerController: IPlayerController;
  private readonly save: typeof gameSave;
  private readonly debugCheats: DebugCheatsController;
  private readonly playerCommandController: IPlayerCommandController;
  private readonly levelLifecycleManager: ILevelLifecycleManager;
  private readonly environmentCollisionSystem: IEnvironmentCollisionSystem;
  private readonly logger: ILogger;
  private readonly circuitBreaker: LoopCircuitBreaker;

  public get loopCircuitBreaker(): LoopCircuitBreaker {
    return this.circuitBreaker;
  }

  public get engineLogger(): ILogger {
    return this.logger;
  }

  public get debugController(): DebugCheatsController {
    return this.debugCheats;
  }

  public get playerCommands(): IPlayerCommandController {
    return this.playerCommandController;
  }

  public get level(): ILevelLifecycleManager {
    return this.levelLifecycleManager;
  }

  public get environmentCollisions(): IEnvironmentCollisionSystem {
    return this.environmentCollisionSystem;
  }

  // Delegated level state getters/setters (Facade / backward compatibility)
  public get currentLocationId(): LocationId {
    return this.levelLifecycleManager.currentLocationId;
  }
  public set currentLocationId(val: LocationId) {
    this.levelLifecycleManager.currentLocationId = val;
  }

  public get currentLocation(): LocationDefinition {
    return this.levelLifecycleManager.currentLocation;
  }
  public set currentLocation(val: LocationDefinition) {
    this.levelLifecycleManager.currentLocation = val;
  }

  public get levelWidth(): number {
    return this.levelLifecycleManager.levelWidth;
  }
  public set levelWidth(val: number) {
    this.levelLifecycleManager.levelWidth = val;
  }

  public get levelHeight(): number {
    return this.levelLifecycleManager.levelHeight;
  }
  public set levelHeight(val: number) {
    this.levelLifecycleManager.levelHeight = val;
  }

  public get spawnPoint(): { x: number; y: number } {
    return this.levelLifecycleManager.spawnPoint;
  }
  public set spawnPoint(val: { x: number; y: number }) {
    this.levelLifecycleManager.spawnPoint = val;
  }

  public get isVictory(): boolean {
    return this.levelLifecycleManager.isVictory;
  }
  public set isVictory(val: boolean) {
    this.levelLifecycleManager.isVictory = val;
  }

  public get isDefeat(): boolean {
    return this.levelLifecycleManager.isDefeat;
  }
  public set isDefeat(val: boolean) {
    this.levelLifecycleManager.isDefeat = val;
  }

  public get isLevelTransitionPending(): boolean {
    return this.levelLifecycleManager.isLevelTransitionPending;
  }
  public set isLevelTransitionPending(val: boolean) {
    this.levelLifecycleManager.isLevelTransitionPending = val;
  }

  public get portalCooldownTimer(): number {
    return this.levelLifecycleManager.portalCooldownTimer;
  }
  public set portalCooldownTimer(val: number) {
    this.levelLifecycleManager.portalCooldownTimer = val;
  }

  // Narration property getter for backward-compatible UI bindings
  public get currentNarrationText(): string {
    return this.narrationSystem.getCurrentText();
  }

  // Settings loaded from JSON
  public settings: GameSettings = {
    language: defaultSettingsJson.language as "pl" | "en",
    volumeMusic: defaultSettingsJson.volumeMusic,
    volumeSFX: defaultSettingsJson.volumeSFX,
    isTwoPlayer: defaultSettingsJson.isTwoPlayer,
    display: {
      aspectRatio: defaultSettingsJson.display.aspectRatio as "16:10" | "16:9" | "4:3",
      scalingFilter: defaultSettingsJson.display.scalingFilter as "pixel" | "smooth",
      assetQuality: defaultSettingsJson.display.assetQuality as AssetQuality,
      hardwareAcceleration: defaultSettingsJson.display.hardwareAcceleration,
      targetFps: (defaultSettingsJson.display.targetFps as TargetFps) || 60,
      showFpsCounter: !!defaultSettingsJson.display.showFpsCounter,
    },
  };

  // Systems
  private renderer: GameRenderer | null = null;
  public readonly particleSystem: ParticleSystem = new ParticleSystem();
  public readonly cameraManager: CameraManager = new CameraManager();
  private isRunning: boolean = false;
  private animationId: number | null = null;
  public isPaused: boolean = false;

  public get isLoopRunning(): boolean {
    return this.isRunning;
  }

  // React listener callbacks
  private stateListeners: Set<() => void> = new Set();
  private lastVitalsHash: string = "";
  private uiSyncTimer: number = 0;

  // Deterministic simulation tick counter (Fixed timestep 60Hz)
  public simulationTicks: number = 0;

  public get simulationTick(): number {
    return this.simulationTicks;
  }

  public checkAndUpdateVitalsSnapshot(): boolean {
    const currentHash = this.players
      .map(
        (p) =>
          `${p.id}:${Math.round(p.health)}:${Math.round(p.mana)}:${Math.round(p.stamina)}:${p.skillPoints}`
      )
      .join("|");
    if (currentHash !== this.lastVitalsHash) {
      this.lastVitalsHash = currentHash;
      return true;
    }
    return false;
  }

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
    this.save = deps.saveManager || gameSave;
    this.debugCheats =
      deps.debugCheats ||
      new DebugCheatsController({
        getPlayers: () => this.players,
        getEnemies: () => this.enemies,
        getLevelDimensions: () => ({ width: this.levelWidth, height: this.levelHeight }),
        spawnBurst: (x, y, color, type, count) =>
          this.particleSystem.spawnBurst(x, y, color, type, count),
        playSFX: (type) => this.audio.playSFX(type),
        recordKill: (playerId, enemyId) => statsManager.recordKill(playerId, enemyId),
        triggerNarration: (key) => this.triggerNarration(key),
        stopEngine: () => this.stop(),
        setVictory: (v) => {
          this.isVictory = v;
        },
        setDefeat: (d) => {
          this.isDefeat = d;
        },
        notifyReact: () => this.notifyReact(),
      });

    this.playerCommandController =
      deps.playerCommands ||
      new PlayerCommandController({
        getPlayers: () => this.players,
        notifyStateChanged: () => this.notifyReact(),
        eventBus: this.eventBus,
      });

    this.levelLifecycleManager =
      deps.levelManager ||
      new LevelLifecycleManager({
        getPlayers: () => this.players,
        setPlayers: (p) => {
          this.players = p;
        },
        getEnemies: () => this.enemies,
        setEnemies: (e) => {
          this.enemies = e;
        },
        getEntities: () => this.entities,
        setEntities: (ent) => {
          this.entities = ent;
        },
        clearProjectiles: () => {
          this.projectiles = [];
        },
        getIsTwoPlayer: () => this.settings.isTwoPlayer,
        setIsTwoPlayer: (val) => {
          this.settings.isTwoPlayer = val;
        },
        getViewportSize: () => ({
          width: this.renderer?.viewportWidth || 1280,
          height: this.renderer?.viewportHeight || 720,
        }),
        snapCamera: (pList, w, h) =>
          this.cameraManager.snapToPlayers(
            pList,
            this.renderer?.viewportWidth || 1280,
            this.renderer?.viewportHeight || 720,
            w,
            h
          ),
        triggerNarration: (key) => this.triggerNarration(key),
        resetNarration: () => this.narrationSystem.reset(),
        playSFX: (type) => this.audio.playSFX(type),
        setMusicIntensity: (intensity) => this.audio.setMusicIntensity(intensity),
        spawnBurst: (x, y, color, type, count) =>
          this.particleSystem.spawnBurst(x, y, color, type, count),
        stopEngine: () => this.stop(),
        startEngine: () => this.start(),
        isRunning: () => this.isRunning,
        notifyReact: () => this.notifyReact(),
      });

    this.environmentCollisionSystem =
      deps.environmentCollisions || new EnvironmentCollisionSystem();

    this.logger = deps.logger || engineLogger;
    this.circuitBreaker =
      deps.circuitBreaker ||
      new LoopCircuitBreaker({
        logger: this.logger,
        onTrip: () => {
          this.isPaused = true;
          this.notifyReact();
        },
      });

    this.levelLifecycleManager.resetLevel("courtyard");
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    this.eventBus.emit("STATE_SNAPSHOT", {
      isPaused: this.isPaused,
      isVictory: this.isVictory,
      isDefeat: this.isDefeat,
    });
    this.notifyReact();
  }

  public togglePause(forceState?: boolean): boolean {
    this.isPaused = forceState !== undefined ? forceState : !this.isPaused;
    this.eventBus.emit("STATE_SNAPSHOT", {
      isPaused: this.isPaused,
      isVictory: this.isVictory,
      isDefeat: this.isDefeat,
    });
    this.notifyReact();
    return this.isPaused;
  }

  public registerStateListener(cb: () => void): () => void {
    this.stateListeners.add(cb);
    return () => {
      this.stateListeners.delete(cb);
    };
  }

  public clearAllListeners(): void {
    this.stateListeners.clear();
    this.eventBus.clear();
  }

  public setCanvasDimensions(
    width: number,
    height: number,
    dpr: number,
    filterMode: "pixel" | "smooth" = "pixel"
  ) {
    this.renderer?.setDimensions(width, height, dpr, filterMode);
  }

  public notifyReact() {
    this.stateListeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        this.logger.error("Error in engine state listener:", { listenerCount: this.stateListeners.size }, err);
      }
    });
  }

  /**
   * Loads and switches the active location by ID.
   * Preserves player progression (HP, mana, stamina, inventory, skills) across room transitions.
   */
  public loadLocation(
    locationId: LocationId,
    targetSpawnPoint?: { x: number; y: number },
    preservePlayerStats: boolean = true
  ) {
    this.logger.info(`Loading location: ${locationId}`, {
      locationId,
      targetSpawnPoint,
      preservePlayerStats,
    });
    this.levelLifecycleManager.loadLocation(locationId, targetSpawnPoint, preservePlayerStats);
    this.eventBus.emit("LOCATION_CHANGED", {
      locationId: this.currentLocationId,
      locationNameKey: this.currentLocation?.nameKey || "locationUnknown",
    });
  }

  public resetLevel(
    locationId?: LocationId,
    customSpawnPoint?: { x: number; y: number },
    preservePlayerStats: boolean = false
  ) {
    this.levelLifecycleManager.resetLevel(locationId, customSpawnPoint, preservePlayerStats);
    this.eventBus.emit("LEVEL_RESET", {
      locationId: this.currentLocationId,
    });
  }

  public setTwoPlayerMode(enabled: boolean, preserveStats: boolean = true) {
    this.levelLifecycleManager.setTwoPlayerMode(enabled, preserveStats);
  }

  public setLanguage(lang: "pl" | "en") {
    this.settings.language = lang;
    this.narrationSystem.setLanguage(lang);
    this.notifyReact();
  }

  public setTargetFps(fps: TargetFps) {
    this.settings.display.targetFps = fps;
    fpsManager.setTargetFps(fps);
    this.notifyReact();
  }

  public setShowFpsCounter(show: boolean) {
    this.settings.display.showFpsCounter = show;
    this.notifyReact();
  }

  public attachCanvas(canvas: HTMLCanvasElement) {
    const isGpu = this.settings.display.hardwareAcceleration !== false;
    this.renderer = new GameRenderer(canvas, {}, { hardwareAcceleration: isGpu });
  }

  public setHardwareAcceleration(enabled: boolean) {
    this.settings.display.hardwareAcceleration = enabled;
    this.renderer?.setHardwareAcceleration(enabled);
    this.notifyReact();
  }

  /**
   * Applies partial game settings to the engine, synchronizing audio, display, and modes.
   */
  public applySettings(settings: Partial<GameSettings>): void {
    if (settings.volumeMusic !== undefined) {
      this.settings.volumeMusic = settings.volumeMusic;
      this.audio.setBGMVolume(settings.volumeMusic);
    }
    if (settings.volumeSFX !== undefined) {
      this.settings.volumeSFX = settings.volumeSFX;
      this.audio.setSFXVolume(settings.volumeSFX);
    }
    if (settings.language !== undefined) {
      this.settings.language = settings.language;
      this.narrationSystem.setLanguage(settings.language);
    }
    if (settings.display) {
      if (settings.display.targetFps !== undefined) {
        this.setTargetFps(settings.display.targetFps);
      }
      if (settings.display.showFpsCounter !== undefined) {
        this.setShowFpsCounter(settings.display.showFpsCounter);
      }
      if (settings.display.hardwareAcceleration !== undefined) {
        this.setHardwareAcceleration(settings.display.hardwareAcceleration);
      }
      this.settings.display = { ...this.settings.display, ...settings.display };
    }
    if (settings.isTwoPlayer !== undefined) {
      if (settings.isTwoPlayer && this.players.length === 1) {
        this.setTwoPlayerMode(true, true);
      } else if (!settings.isTwoPlayer && this.players.length > 1) {
        this.setTwoPlayerMode(false, true);
      }
    }
    this.notifyReact();
  }

  public start() {
    if (this.isRunning) return;
    this.logger.info("Starting GameEngine loop");
    this.isRunning = true;

    fpsManager.setTargetFps(this.settings.display.targetFps || 60);
    fpsManager.reset();

    this.audio.init();
    this.audio.setMusicIntensity(this.currentLocation?.theme.musicIntensity || 0.1);

    let lastTimestamp = 0;
    const MAX_STEPS_PER_FRAME = 8; // Guard against spiral of death

    const loop = (timestamp: number) => {
      if (!this.isRunning) return;

      if (lastTimestamp === 0) {
        lastTimestamp = timestamp;
      }
      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (this.isPaused) {
        this.circuitBreaker.execute("renderFrame (paused)", () => this.renderFrame(1.0));
      } else {
        fpsManager.pushDelta(elapsed);
        const stepMultiplier = fpsManager.getStepMultiplier() * (debugManager.state.timeScale || 1.0);

        let updateSteps = 0;
        while (fpsManager.consumeFixedStep() && updateSteps < MAX_STEPS_PER_FRAME) {
          const success = this.circuitBreaker.execute("fixedUpdate", () => this.fixedUpdate(stepMultiplier));
          if (!success) {
            break;
          }
          updateSteps++;
        }

        const alpha = fpsManager.getInterpolationAlpha();
        this.circuitBreaker.execute("renderFrame", () => this.renderFrame(alpha));
      }

      fpsManager.recordFrameRender(timestamp);
      if (typeof requestAnimationFrame !== "undefined") {
        this.animationId = requestAnimationFrame(loop);
      }
    };

    if (typeof requestAnimationFrame !== "undefined") {
      this.animationId = requestAnimationFrame(loop);
    }
  }

  public stop() {
    this.logger.info("Stopping GameEngine loop");
    this.isRunning = false;
    if (this.animationId) {
      if (typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(this.animationId);
      }
      this.animationId = null;
    }
    this.audio.stopBGM();
  }

  /**
   * Compiles an immutable snapshot of current game state across all subsystems.
   */
  public createSaveSnapshot(): SaveState {
    return this.save.compileSaveState(
      this.players,
      this.enemies,
      this.entities,
      this.currentLocationId
    );
  }

  /**
   * Restores game world and entities from a SaveState snapshot.
   */
  public restoreFromSnapshot(state: SaveState): boolean {
    if (state.levelId && (state.levelId as LocationId) in LOCATION_REGISTRY) {
      this.currentLocationId = state.levelId as LocationId;
    }
    this.resetLevel(this.currentLocationId);

    const success = this.save.applySaveState(state, this.players, this.enemies, this.entities);
    if (success) {
      const hasP2InSave = state.p2Health > 0;
      this.settings.isTwoPlayer = hasP2InSave;
      this.isDefeat = false;
      this.isVictory = false;
      this.notifyReact();
      return true;
    }
    return false;
  }

  public saveGame() {
    const state = this.createSaveSnapshot();
    this.save.exportToFile(state);
    this.triggerNarration("saveSuccess");
    this.notifyReact();
  }

  public loadGame(stateFromFile?: SaveState) {
    const state = stateFromFile || this.save.loadFromLocalStorage();
    if (!state) {
      this.triggerNarration("noSaveFound");
      return;
    }
    const success = this.restoreFromSnapshot(state);
    if (success) {
      this.triggerNarration("loadSuccess");
    }
  }

  public triggerNarration(key: string) {
    const triggered = this.narrationSystem.trigger(key, this.settings.language);
    if (triggered) {
      this.eventBus.emit("NARRATION_TRIGGERED", {
        textKey: key,
        text: this.narrationSystem.getCurrentText(),
      });
      this.notifyReact();
    }
  }

  /**
   * Deterministic physics & logic simulation step (Fixed Timestep 60Hz / 15-FPS quantum).
   * Fully decoupled from rendering.
   */
  public fixedUpdate(stepMultiplier: number = 1.0) {
    const effectiveDt = stepMultiplier * (debugManager.state.timeScale || 1.0);
    this.simulationTicks += effectiveDt;

    let anyPlayerAttacking = false;
    let anyEnemyAggro = false;

    // Portal immunity cooldown timer
    this.levelLifecycleManager.decrementCooldowns();

    // Track active playtime (scaled with FPS delta multiplier)
    statsManager.addPlayTime(effectiveDt / 60);

    // 1. Process inputs & physics for players
    this.players.forEach((player, pIndex) => {
      // Dynamic Level Group / Tier Progression based on skills unlocked or score
      const skillCount = player.unlockedSkills ? player.unlockedSkills.length : 0;
      const computedTier: 1 | 2 | 3 = skillCount >= 6 ? 3 : skillCount >= 3 ? 2 : 1;
      player.levelGroup = computedTier;
      player.characterTier = computedTier;

      const inputs = this.inputs.getInputs(player.id);

      // DEBUG CHEATS: Infinite Mana & Stamina
      if (debugManager.state.infiniteMana) {
        player.mana = player.maxMana;
      }
      if (debugManager.state.infiniteStamina) {
        player.stamina = player.maxStamina;
      }
      if (debugManager.state.godMode) {
        player.health = player.maxHealth;
        player.isDead = false;
      }

      // 1. Process player states, resource lifecycles & actions (SRP via PlayerController)
      this.playerController.updateResourcesAndActions(player, inputs, effectiveDt, this.audio);

      // 2. Update kinematics & spatial physics (SRP via GamePhysicsEngine)
      if (debugManager.state.noClip) {
        // NoClip / Ghost flight mode
        const flySpeed = 8;
        player.vx = inputs.left ? -flySpeed : inputs.right ? flySpeed : 0;
        player.vy = inputs.up ? -flySpeed : inputs.down ? flySpeed : 0;
        player.x += player.vx * effectiveDt;
        player.y += player.vy * effectiveDt;
        player.isGrounded = false;
      } else {
        this.physics.updatePlayer(player, inputs, effectiveDt);
      }

      if (player.isAttacking || player.isCasting) {
        anyPlayerAttacking = true;
      }

      // Quick potion triggers
      if (inputs.potion1) {
        if (this.playerCommandController.usePlayerPotion(pIndex, 0)) {
          this.checkAndUpdateVitalsSnapshot();
        }
      }
      if (inputs.potion2) {
        if (this.playerCommandController.usePlayerPotion(pIndex, 1)) {
          this.checkAndUpdateVitalsSnapshot();
        }
      }
      if (inputs.potion3) {
        if (this.playerCommandController.usePlayerPotion(pIndex, 2)) {
          this.checkAndUpdateVitalsSnapshot();
        }
      }

      // Magic Spell Cast: Primary
      if (inputs.magic1 && player.magicCooldown === 0) {
        const castRes = attemptCastSpell(player, player.primarySpellId, inputs, this.audio);
        if (castRes.ok) {
          player.isCasting = true;
          player.castTime = 16;
          statsManager.recordSpellCast(player.id);
          if (castRes.value.projectiles.length > 0) {
            this.projectiles.push(...castRes.value.projectiles);
          }
          this.particleSystem.spawnBurst(
            player.x + player.width / 2,
            player.y + player.height / 2,
            "#38bdf8",
            "magic",
            6
          );
          this.checkAndUpdateVitalsSnapshot();
          this.notifyReact();
        }
      }

      // Magic Spell Cast: Secondary
      if (inputs.magic2 && player.magicCooldown === 0) {
        const castRes = attemptCastSpell(player, player.secondarySpellId, inputs, this.audio);
        if (castRes.ok) {
          player.isCasting = true;
          player.castTime = 16;
          statsManager.recordSpellCast(player.id);
          if (castRes.value.projectiles.length > 0) {
            this.projectiles.push(...castRes.value.projectiles);
          }
          this.particleSystem.spawnBurst(
            player.x + player.width / 2,
            player.y + player.height / 2,
            "#a855f7",
            "magic",
            6
          );
          this.checkAndUpdateVitalsSnapshot();
          this.notifyReact();
        }
      }

      // Screen bound clamps
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > this.levelWidth) player.x = this.levelWidth - player.width;

      // Defeat falls down bottom pit
      if (player.y > this.levelHeight + 100) {
        if (debugManager.state.godMode) {
          player.x = this.spawnPoint.x;
          player.y = this.spawnPoint.y;
          player.vx = 0;
          player.vy = 0;
          this.particleSystem.spawnBurst(player.x, player.y, "#22c55e", "spark", 15);
        } else {
          player.health = 0;
          player.isDead = true;
          this.isDefeat = true;
          this.triggerNarration("defeat");
        }
      }
    });

    // 2. Process Auto Skills (e.g. Sentinel Spark) via CombatSystem
    this.combatSystem.processAutoSkills(
      this.players,
      this.enemies,
      this.projectiles,
      stepMultiplier,
      this.audio
    );

    // 3. Resolve two-player co-op physics and soft separation
    if (this.players.length > 1) {
      this.physics.resolvePlayerPlayerCollision(this.players, stepMultiplier);
    }

    // Context for combat interactions
    const combatContext = {
      cameraManager: this.cameraManager,
      particleSystem: this.particleSystem,
      collisionEngine: this.collisions,
      audio: this.audio,
      triggerNarration: (id: string) => this.triggerNarration(id),
      onLeverActivated: (id: string) => this.levelLifecycleManager.handleLeverUnlocks(id),
    };

    // 4. Process Melee sword attacks via CombatSystem
    if (anyPlayerAttacking) {
      this.combatSystem.processMeleeAttacks(
        this.players,
        this.enemies,
        this.entities,
        combatContext
      );
    }

    // 5. Update & collide Magic Projectiles via CombatSystem
    this.projectiles = this.combatSystem.updateProjectiles(
      this.projectiles,
      this.players,
      this.enemies,
      this.entities,
      effectiveDt,
      this.levelWidth,
      this.levelHeight,
      combatContext
    );

    // 6. Update Enemies via EnemyAISystem
    if (!debugManager.state.freezeAI) {
      anyEnemyAggro = this.enemyAISystem.update(
        this.enemies,
        this.players,
        this.physics,
        effectiveDt
      );
    }

    // 7. Update Environmental platform physics with player rider tracking
    this.physics.updateEntities(this.entities, effectiveDt, this.players);

    // 8. Apply Environmental collisions (SRP via EnvironmentCollisionSystem)
    this.environmentCollisionSystem.resolveEnvironmentCollisions(
      this.players,
      this.entities,
      this.levelWidth,
      this.portalCooldownTimer,
      {
        collisionEngine: this.collisions,
        triggerNarration: (id: string) => this.triggerNarration(id),
        onGoalReached: (goalEntity?: Entity) =>
          this.levelLifecycleManager.handleGoalCompletion(goalEntity),
        onLeverActivated: (id: string) =>
          this.levelLifecycleManager.handleLeverUnlocks(id),
        spawnBurst: (x, y, color, type, count) =>
          this.particleSystem.spawnBurst(x, y, color, type, count),
        isNoClip: () => !!debugManager.state.noClip,
        isLevelTransitionPending: () => this.isLevelTransitionPending,
      }
    );

    if (this.levelLifecycleManager.consumeLevelTransitionPending()) {
      return;
    }

    // 9. Dynamic Music intensity
    if (anyEnemyAggro || anyPlayerAttacking || this.projectiles.length > 0) {
      this.audio.setMusicIntensity(0.7);
    } else {
      this.audio.setMusicIntensity(this.currentLocation?.theme.musicIntensity || 0.1);
    }

    // 10. Update particle simulation
    this.particleSystem.update(this.cameraManager.x);

    // 11. Update narration fading timers (SRP via NarrationSystem)
    const narrationChanged = this.narrationSystem.update(stepMultiplier);
    if (narrationChanged) {
      this.notifyReact();
    }

    // 12. Throttled UI telemetry synchronization for player vitals (health, mana, stamina)
    this.uiSyncTimer += stepMultiplier;
    if (this.uiSyncTimer >= 6) {
      this.uiSyncTimer = 0;
      if (this.checkAndUpdateVitalsSnapshot()) {
        this.notifyReact();
      }
    }
  }

  /**
   * Decoupled rendering pass (interpolates positions on Canvas 2D without mutating game state).
   */
  public renderFrame(interpolationAlpha: number = 1.0) {
    if (!this.renderer) return;

    const cameraState = this.cameraManager.update(
      this.players,
      this.renderer.viewportWidth,
      this.renderer.viewportHeight,
      this.levelWidth,
      this.levelHeight
    );

    const continuousTick =
      this.simulationTicks +
      (this.isPaused ? 0 : interpolationAlpha * (debugManager.state.timeScale || 1.0));

    this.renderer.render(
      this.players,
      this.enemies,
      this.entities,
      this.projectiles,
      this.particleSystem.getParticles(),
      cameraState,
      this.levelWidth,
      this.levelHeight,
      this.settings.display.assetQuality,
      this.currentLocation,
      this.settings.language,
      continuousTick,
      {
        targetFps: fpsManager.getTargetFps(),
        measuredFps: fpsManager.getMeasuredFps(),
        showFps: !!this.settings.display.showFpsCounter,
      }
    );
  }

  /**
   * Executes a single synchronized step + render pass (backward compatibility).
   */
  public tick(dtMultiplier: number = 1.0) {
    if (this.isPaused) {
      this.renderFrame(1.0);
      return;
    }
    this.fixedUpdate(dtMultiplier);
    this.renderFrame(1.0);
  }

  public advanceToNextLocation() {
    this.levelLifecycleManager.advanceToNextLocation();
    this.eventBus.emit("LOCATION_CHANGED", {
      locationId: this.currentLocationId,
      locationNameKey: this.currentLocation?.nameKey || "locationUnknown",
    });
  }

  /** Tester and debug suite actions */

  public getRenderer(): GameRenderer | null {
    return this.renderer;
  }

  public getRendererScaleFactor(): number {
    return this.renderer ? this.renderer.scaleFactor : 1;
  }

  /** Debug & Cheat delegation to DebugCheatsController */

  public teleportPlayer(playerId: PlayerId = PlayerId.Player1, x: number, y: number) {
    this.debugCheats.teleportPlayer(playerId, x, y);
  }

  public killAllEnemies() {
    this.debugCheats.killAllEnemies();
  }

  public damageEnemy(enemyId: string, amount: number = 50): boolean {
    return this.debugCheats.damageEnemy(enemyId, amount);
  }

  public removeEnemy(enemyId: string): boolean {
    return this.debugCheats.removeEnemy(enemyId);
  }

  public spawnEnemy(enemyType: string, customX?: number, customY?: number): Enemy {
    return this.debugCheats.spawnEnemy(enemyType, customX, customY);
  }

  public refillVitals(playerIndex: number = 0) {
    this.debugCheats.refillVitals(playerIndex);
  }

  public setPlayerStat(
    playerIndex: number,
    stat: "health" | "maxHealth" | "mana" | "maxMana" | "stamina" | "maxStamina",
    value: number
  ) {
    this.debugCheats.setPlayerStat(playerIndex, stat, value);
  }

  public unlockAllSkills(playerIndex: number = 0) {
    this.debugCheats.unlockAllSkills(playerIndex);
  }

  public giveAllWeapons(playerIndex: number = 0) {
    this.debugCheats.giveAllWeapons(playerIndex);
  }

  public givePotions(playerIndex: number = 0) {
    this.debugCheats.givePotions(playerIndex);
  }

  public addGold(amount: number) {
    this.debugCheats.addGold(amount);
  }

  public clearInventory(playerIndex: number = 0) {
    this.debugCheats.clearInventory(playerIndex);
  }

  public triggerParticleBurst(type: "dust" | "spark" | "magic", count: number = 25) {
    this.debugCheats.triggerParticleBurst(type, count);
  }

  public forceVictory() {
    this.debugCheats.forceVictory();
  }

  public forceDefeat() {
    this.debugCheats.forceDefeat();
  }

  // --- Player Command Pipeline ---

  public equipPlayerItem(playerIndex: number, backpackIndex: number): boolean {
    return this.playerCommandController.equipPlayerItem(playerIndex, backpackIndex);
  }

  public unequipPlayerItem(playerIndex: number, slot: keyof EquipmentState): boolean {
    return this.playerCommandController.unequipPlayerItem(playerIndex, slot);
  }

  public usePlayerPotion(playerIndex: number, slotIndex: number): boolean {
    const success = this.playerCommandController.usePlayerPotion(playerIndex, slotIndex);
    if (success) {
      this.eventBus.emit("ITEM_CONSUMED", {
        playerIndex,
        slotIndex,
      });
    }
    return success;
  }

  public discardPlayerItem(playerIndex: number, backpackIndex: number): boolean {
    return this.playerCommandController.discardPlayerItem(playerIndex, backpackIndex);
  }

  public resetPlayerInventoryToDefaults(): void {
    this.playerCommandController.resetPlayerInventoryToDefaults();
  }

  public unlockPlayerSkill(playerIndex: number, nodeId: string): { success: boolean; messageKey?: string } {
    return this.playerCommandController.unlockPlayerSkill(playerIndex, nodeId);
  }

  public assignPlayerSpell(playerIndex: number, spellId: string, slot: "primary" | "secondary"): boolean {
    return this.playerCommandController.assignPlayerSpell(playerIndex, spellId, slot);
  }

  public resetPlayerSkillsToDefaults(): void {
    this.playerCommandController.resetPlayerSkillsToDefaults();
  }

  public stepSingleFrame() {
    const wasPaused = this.isPaused;
    this.isPaused = false;
    this.tick(1.0);
    this.isPaused = wasPaused;
    this.notifyReact();
  }

  public setMusicIntensity(intensity: number) {
    this.audio.setMusicIntensity(intensity);
  }

  public playSFX(type: SoundType) {
    this.audio.playSFX(type);
  }
}

export const gameEngine = new GameEngine();
export default gameEngine;
