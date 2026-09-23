import {
  Player,
  Enemy,
  Entity,
  CollisionType,
  SoundType,
  GameSettings,
  SaveState,
  Projectile,
  AssetQuality,
  PlayerId,
  EquipmentState,
} from "../types";
import { gameAudio, GameAudioEngine } from "../engine/audioEngine";
import { gameInputs, GameInputEngine } from "./input";
import { gamePhysics, GamePhysicsEngine } from "../physics/physics";
import { gameCollisions, ICollisionEngine } from "../physics/collisions";
import { LevelDesigner } from "../locations/levels";
import { LocationId, LocationDefinition, getLocation, getNextLocation } from "../locations";
import { GameRenderer } from "../renderer/renderer";
import { ParticleSystem } from "./../engine/particleSystem";
import { CameraManager } from "../engine/cameraManager";
import { gameSave } from "../logic/save";
import { castMagicSpell } from "../logic/magic";
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
import { debugManager } from "../debug/debugManager";
import defaultSettingsJson from "../data/defaultSettings.json";

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
}

/**
 * Core Game Engine and Orchestrator.
 * Coordinates State, Inputs, Physics, Collisions, Magic/Projectiles, Synthesizer Audio, and Pixel Rendering.
 * Refactored to adhere to SOLID principles:
 * - SRP: Extracted CombatSystem, EnemyAISystem, NarrationSystem, and PlayerController.
 * - DIP: Injects domain subsystems with fallback defaults.
 * - LSP & ISP: Uses typed interfaces (ICollisionEngine, ICollisionContext, ICombatSystem, IPlayerController).
 */
export class GameEngine {
  // Game state
  public players: Player[] = [];
  public enemies: Enemy[] = [];
  public entities: Entity[] = [];
  public projectiles: Projectile[] = [];
  public levelWidth: number = 2600;
  public levelHeight: number = 650;
  public spawnPoint = { x: 120, y: 460 };
  public currentLocationId: LocationId = "courtyard";
  public currentLocation: LocationDefinition = getLocation("courtyard");

  // Subsystems (DIP)
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

  public get debugController(): DebugCheatsController {
    return this.debugCheats;
  }

  public get playerCommands(): IPlayerCommandController {
    return this.playerCommandController;
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

  // Level markers
  public isVictory: boolean = false;
  public isDefeat: boolean = false;
  private isLevelTransitionPending: boolean = false;
  public portalCooldownTimer: number = 0;
  public isPaused: boolean = false;

  // React listener callbacks
  private stateListeners: Set<() => void> = new Set();
  private lastVitalsHash: string = "";
  private uiSyncTimer: number = 0;

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
      });

    this.resetLevel("courtyard");
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
    this.notifyReact();
  }

  public togglePause(forceState?: boolean): boolean {
    this.isPaused = forceState !== undefined ? forceState : !this.isPaused;
    this.notifyReact();
    return this.isPaused;
  }

  public registerStateListener(cb: () => void): () => void {
    this.stateListeners.add(cb);
    return () => {
      this.stateListeners.delete(cb);
    };
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
        console.error("Error in engine state listener:", err);
      }
    });
  }

  /**
   * Loads and switches the active location by ID.
   * Preserves player progression (HP, mana, stamina, inventory, skills) like Castlevania.
   */
  public loadLocation(
    locationId: LocationId,
    targetSpawnPoint?: { x: number; y: number },
    preservePlayerStats: boolean = true
  ) {
    this.currentLocationId = locationId;
    this.resetLevel(locationId, targetSpawnPoint, preservePlayerStats);
    if (!this.isRunning) {
      this.start();
    }
  }

  public resetLevel(
    locationId?: LocationId,
    customSpawnPoint?: { x: number; y: number },
    preservePlayerStats: boolean = false
  ) {
    if (locationId) {
      this.currentLocationId = locationId;
    }
    const targetLocId = this.currentLocationId || "courtyard";
    const data = LevelDesigner.createLocationState(
      targetLocId,
      this.settings.isTwoPlayer,
      customSpawnPoint,
      preservePlayerStats ? this.players : undefined
    );

    this.players = data.players;
    this.enemies = data.enemies;
    this.entities = data.entities;
    this.projectiles = [];
    this.levelWidth = data.levelWidth;
    this.levelHeight = data.levelHeight;
    this.spawnPoint = data.spawnPoint;
    this.currentLocation = data.location;
    // Explicitly maintain engine settings in sync with active player session
    this.settings.isTwoPlayer = this.players.length > 1;

    this.isVictory = false;
    this.isDefeat = false;
    this.isLevelTransitionPending = false;
    this.portalCooldownTimer = 45;
    this.narrationSystem.reset();

    this.cameraManager.snapToPlayers(
      this.players,
      this.renderer?.viewportWidth || 1280,
      this.renderer?.viewportHeight || 720,
      this.levelWidth,
      this.levelHeight
    );

    this.triggerNarration(this.currentLocation.openingNarrationKey || "narrationOpening");
    this.audio.setMusicIntensity(this.currentLocation.theme.musicIntensity);
    this.notifyReact();
  }

  public setTwoPlayerMode(enabled: boolean, preserveStats: boolean = true) {
    this.settings.isTwoPlayer = enabled;
    if (preserveStats && this.players && this.players.length > 0) {
      if (enabled && this.players.length === 1) {
        const p1 = this.players[0];
        const p2Offset = this.currentLocation?.p2SpawnOffset || { x: 40, y: 0 };
        const p2X = Math.max(0, Math.min(this.levelWidth - 32, p1.x + p2Offset.x));
        const p2Y = p1.y;
        this.players.push(LevelDesigner.createDefaultP2(p2X, p2Y));
      } else if (!enabled && this.players.length > 1) {
        this.players = [this.players[0]];
      }
      this.notifyReact();
    } else {
      this.resetLevel(undefined, undefined, preserveStats);
    }
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

  public start() {
    if (this.isRunning) return;
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
        this.renderFrame(1.0);
      } else {
        fpsManager.pushDelta(elapsed);
        const stepMultiplier = fpsManager.getStepMultiplier() * (debugManager.state.timeScale || 1.0);

        let updateSteps = 0;
        while (fpsManager.consumeFixedStep() && updateSteps < MAX_STEPS_PER_FRAME) {
          this.fixedUpdate(stepMultiplier);
          updateSteps++;
        }

        const alpha = fpsManager.getInterpolationAlpha();
        this.renderFrame(alpha);
      }

      fpsManager.recordFrameRender(timestamp);
      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.audio.stopBGM();
  }

  public saveGame() {
    const state = this.save.compileSaveState(
      this.players,
      this.enemies,
      this.entities,
      this.currentLocationId
    );
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

    const hasP2InSave = state.p2Health > 0;
    this.settings.isTwoPlayer = hasP2InSave;
    if (state.levelId && (state.levelId as LocationId) in getLocation) {
      this.currentLocationId = state.levelId as LocationId;
    }
    this.resetLevel(this.currentLocationId);

    const success = this.save.applySaveState(state, this.players, this.enemies, this.entities);
    if (success) {
      this.isDefeat = false;
      this.isVictory = false;
      this.triggerNarration("loadSuccess");
      this.notifyReact();
    }
  }

  public triggerNarration(key: string) {
    const triggered = this.narrationSystem.trigger(key, this.settings.language);
    if (triggered) {
      this.notifyReact();
    }
  }

  /**
   * Deterministic physics & logic simulation step (Fixed Timestep 60Hz / 15-FPS quantum).
   * Fully decoupled from rendering.
   */
  public fixedUpdate(stepMultiplier: number = 1.0) {
    const effectiveDt = stepMultiplier * (debugManager.state.timeScale || 1.0);

    let anyPlayerAttacking = false;
    let anyEnemyAggro = false;

    // Portal immunity cooldown timer
    if (this.portalCooldownTimer > 0) {
      this.portalCooldownTimer -= 1;
    }

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
        const newProjectiles = castMagicSpell(player, player.primarySpellId, inputs, this.audio);
        if (newProjectiles.length > 0) {
          player.isCasting = true;
          player.castTime = 16;
          statsManager.recordSpellCast(player.id);
          this.projectiles.push(...newProjectiles);
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
        const newProjectiles = castMagicSpell(player, player.secondarySpellId, inputs, this.audio);
        if (newProjectiles.length > 0) {
          player.isCasting = true;
          player.castTime = 16;
          statsManager.recordSpellCast(player.id);
          this.projectiles.push(...newProjectiles);
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
      onLeverActivated: (id: string) => this.handleLeverUnlocks(id),
    };

    // 4. Process Melee sword attacks via CombatSystem (SRP)
    if (anyPlayerAttacking) {
      this.combatSystem.processMeleeAttacks(
        this.players,
        this.enemies,
        this.entities,
        combatContext
      );
    }

    // 5. Update & collide Magic Projectiles via CombatSystem (SRP)
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

    // 6. Update Enemies via EnemyAISystem (SRP)
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

    // 8. Apply Environmental collisions
    for (const player of this.players) {
      if (this.isLevelTransitionPending) break;
      if (debugManager.state.noClip) continue; // Ghost / noclip mode passes through terrain
      let groundedThisFrame = false;

      for (const entity of this.entities) {
        if (this.isLevelTransitionPending) break;
        if (entity.y === -1000) continue;

        // Portal grace period after transition prevents immediate re-trigger / ping-pong
        if (entity.type === CollisionType.Goal && this.portalCooldownTimer > 0) {
          continue;
        }

        const collides = this.collisions.checkIntersection(player, entity);
        if (collides) {
          // If hazard and player has active shield, shield absorbs damage!
          if (entity.type === CollisionType.Hazard && player.shieldActiveTime > 0) {
            this.particleSystem.spawnBurst(
              player.x + player.width / 2,
              player.y + player.height / 2,
              "#a855f7",
              "spark",
              8
            );
            continue;
          }

          this.collisions.resolve(player, entity, {
            triggerNarration: (id: string) => this.triggerNarration(id),
            onGoalReached: (goalEntity?: Entity) => this.handleGoalCompletion(goalEntity),
            onLeverActivated: (id: string) => this.handleLeverUnlocks(id),
          });

          if (this.isLevelTransitionPending) {
            break;
          }

          if (
            (entity.type === CollisionType.Solid || entity.type === CollisionType.OneWay) &&
            player.vy === 0 &&
            player.y + player.height <= entity.y + 10
          ) {
            groundedThisFrame = true;
            player.standingPlatformId = entity.id;
            player.platformVelocityX = entity.vx || 0;
            player.platformVelocityY = entity.vy || 0;
          }
        }
      }

      if (this.isLevelTransitionPending) {
        break;
      }

      if (groundedThisFrame) {
        if (!player.isGrounded) {
          // Landing puff dust particles
          this.particleSystem.spawnBurst(
            player.x + player.width / 2,
            player.y + player.height,
            "#fed7aa",
            "dust",
            6
          );
        }
        player.isGrounded = true;
      } else if (player.isGrounded) {
        let solidBeneath = false;
        const testFeet = {
          x: player.x,
          y: player.y + 1,
          width: player.width,
          height: player.height,
        };

        for (const entity of this.entities) {
          if (
            (entity.type === CollisionType.Solid || entity.type === CollisionType.OneWay) &&
            entity.y !== -1000
          ) {
            if (
              testFeet.x < entity.x + entity.width &&
              testFeet.x + testFeet.width > entity.x &&
              testFeet.y < entity.y + entity.height &&
              testFeet.y + testFeet.height > entity.y
            ) {
              solidBeneath = true;
              player.standingPlatformId = entity.id;
              player.platformVelocityX = entity.vx || 0;
              player.platformVelocityY = entity.vy || 0;
              break;
            }
          }
        }
        if (!solidBeneath) {
          player.isGrounded = false;
          player.standingPlatformId = null;
          player.platformVelocityX = 0;
          player.platformVelocityY = 0;
        }
      }

      // Screen bound clamps (ensure platform carriage never pushes outside map bounds)
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > this.levelWidth) player.x = this.levelWidth - player.width;
    }

    if (this.isLevelTransitionPending) {
      this.isLevelTransitionPending = false;
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
      interpolationAlpha,
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

  private handleLeverUnlocks(triggerId: string) {
    statsManager.recordLeverPulled();
    this.entities.forEach((entity) => {
      // Check if entity is a gate or wall in this location
      if (
        entity.type === CollisionType.Solid &&
        (entity.id.includes("gate") || entity.id.includes("wall") || entity.id === "grand_gate")
      ) {
        entity.y = -1000; // lift gate out of collision
        this.audio.playSFX(SoundType.SFX_UNLOCK);
        this.triggerNarration("trainingLeverSuccess");

        this.particleSystem.spawnBurst(entity.x + entity.width / 2, 300, "#e2b653", "dust", 20);
      }
    });
    this.notifyReact();
  }

  private handleGoalCompletion(portalEntity?: Entity) {
    statsManager.recordLevelCompleted();
    this.audio.playSFX(SoundType.SFX_SAVE);

    // If portal specifies targetLocationId, transition seamlessly across the Castlevania network!
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
        this.particleSystem.spawnBurst(
          portalEntity.x + portalEntity.width / 2,
          portalEntity.y + portalEntity.height / 2,
          "#f59e0b",
          "magic",
          35
        );
      }
      this.isVictory = true;
      this.triggerNarration("trainingGoalSuccess");
      this.stop();
      this.notifyReact();
      return;
    }

    if (targetLocId && targetLocId !== this.currentLocationId) {
      if (portalEntity) {
        const pColor = portalEntity.portalColors?.outer || "#06b6d4";
        const pEffect =
          portalEntity.particleEffect === "dust" || portalEntity.particleEffect === "spark"
            ? portalEntity.particleEffect
            : "magic";
        this.particleSystem.spawnBurst(
          portalEntity.x + portalEntity.width / 2,
          portalEntity.y + portalEntity.height / 2,
          pColor,
          pEffect,
          30
        );
      }
      this.isLevelTransitionPending = true;
      this.portalCooldownTimer = 45;
      this.loadLocation(targetLocId, targetSpawn, true);
      this.notifyReact();
      return;
    }

    // Final victory if no further location
    this.isVictory = true;
    this.triggerNarration("trainingGoalSuccess");
    this.stop();
    this.notifyReact();
  }

  public advanceToNextLocation() {
    const nextLoc = getNextLocation(this.currentLocationId);
    this.loadLocation(nextLoc.id, undefined, true);
    if (!this.isRunning) {
      this.start();
    }
    this.notifyReact();
  }

  // ==========================================
  // TESTER & DEBUG SUITE ACTIONS
  // ==========================================

  public getRenderer(): GameRenderer | null {
    return this.renderer;
  }

  public getRendererScaleFactor(): number {
    return this.renderer ? this.renderer.scaleFactor : 1;
  }

  // --- Debug & Cheat Delegation (Delegated to DebugCheatsController - SRP) ---

  public teleportPlayer(playerId: PlayerId = PlayerId.Player1, x: number, y: number) {
    this.debugCheats.teleportPlayer(playerId, x, y);
  }

  public killAllEnemies() {
    this.debugCheats.killAllEnemies();
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

  // --- Player Command Pipeline (AGENT.md unidirectional architecture) ---

  public equipPlayerItem(playerIndex: number, backpackIndex: number): boolean {
    return this.playerCommandController.equipPlayerItem(playerIndex, backpackIndex);
  }

  public unequipPlayerItem(playerIndex: number, slot: keyof EquipmentState): boolean {
    return this.playerCommandController.unequipPlayerItem(playerIndex, slot);
  }

  public usePlayerPotion(playerIndex: number, slotIndex: number): boolean {
    return this.playerCommandController.usePlayerPotion(playerIndex, slotIndex);
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
