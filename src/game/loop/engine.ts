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
import { castMagicSpell, SPELL_REGISTRY } from "../logic/magic";
import { useQuickPotion, ITEM_REGISTRY } from "../logic/inventory";
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
      targetFps: ((defaultSettingsJson as any).display?.targetFps as TargetFps) || 60,
      showFpsCounter: !!(defaultSettingsJson as any).display?.showFpsCounter,
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
    this.renderer = new GameRenderer(canvas);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    fpsManager.setTargetFps(this.settings.display.targetFps || 60);
    fpsManager.reset();

    this.audio.init();
    this.audio.setMusicIntensity(this.currentLocation?.theme.musicIntensity || 0.1);

    const loop = (timestamp: number) => {
      if (!this.isRunning) return;
      if (fpsManager.shouldExecuteFrame(timestamp)) {
        const dtMultiplier = fpsManager.getDtMultiplier();
        this.tick(dtMultiplier);
      }
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
   * Executes a single frame update with exact FPS delta multiplier scaling.
   */
  private tick(dtMultiplier: number = 1.0) {
    const effectiveDt = dtMultiplier * (debugManager.state.timeScale || 1.0);

    if (this.isPaused) {
      if (this.renderer) {
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
          effectiveDt,
          {
            targetFps: fpsManager.getTargetFps(),
            measuredFps: fpsManager.getMeasuredFps(),
            showFps: !!this.settings.display.showFpsCounter,
          }
        );
      }
      return;
    }

    let anyPlayerAttacking = false;
    let anyEnemyAggro = false;

    // Portal immunity cooldown timer
    if (this.portalCooldownTimer > 0) {
      this.portalCooldownTimer -= 1;
    }

    // Track active playtime (scaled with FPS delta multiplier)
    statsManager.addPlayTime(effectiveDt / 60);

    // 1. Process inputs & physics for players
    this.players.forEach((player) => {
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
      if (inputs.potion1) useQuickPotion(player, 0);
      if (inputs.potion2) useQuickPotion(player, 1);
      if (inputs.potion3) useQuickPotion(player, 2);

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
      dtMultiplier,
      this.audio
    );

    // 3. Resolve two-player co-op physics and soft separation
    if (this.players.length > 1) {
      this.physics.resolvePlayerPlayerCollision(this.players, dtMultiplier);
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
    const narrationChanged = this.narrationSystem.update(dtMultiplier);
    if (narrationChanged) {
      this.notifyReact();
    }

    // 10. Update Camera & Render the frame on canvas
    if (this.renderer) {
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
        dtMultiplier,
        {
          targetFps: fpsManager.getTargetFps(),
          measuredFps: fpsManager.getMeasuredFps(),
          showFps: !!this.settings.display.showFpsCounter,
        }
      );
    }
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

  public teleportPlayer(playerId: PlayerId = PlayerId.Player1, x: number, y: number) {
    const player = this.players.find((p) => p.id === playerId) || this.players[0];
    if (!player) return;

    // Burst at old position
    this.particleSystem.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, "#38bdf8", "spark", 10);

    player.x = Math.max(0, Math.min(this.levelWidth - player.width, x));
    player.y = Math.max(0, Math.min(this.levelHeight - player.height, y));
    player.vx = 0;
    player.vy = 0;
    player.isGrounded = false;

    // Burst at new arrival position
    this.particleSystem.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, "#a855f7", "magic", 16);
    this.audio.playSFX(SoundType.SFX_UNLOCK);
    this.notifyReact();
  }

  public killAllEnemies() {
    this.enemies.forEach((enemy) => {
      if (!enemy.isDead) {
        enemy.health = 0;
        enemy.isDead = true;
        this.particleSystem.spawnBurst(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          "#f43f5e",
          "spark",
          12
        );
        statsManager.recordKill(PlayerId.Player1, enemy.id);
      }
    });
    this.audio.playSFX(SoundType.SFX_HIT);
    this.notifyReact();
  }

  public spawnEnemy(enemyType: string, customX?: number, customY?: number) {
    const p1 = this.players[0];
    const spawnX = customX !== undefined ? customX : (p1 ? p1.x + 120 : 300);
    const spawnY = customY !== undefined ? customY : (p1 ? p1.y : 400);

    const id = `debug_${enemyType}_${Date.now()}`;
    let name = enemyType.replace(/_/g, " ");
    let maxHp = 100;
    let width = 36;
    let height = 48;
    let isAerial = false;
    let isDummy = false;

    if (enemyType.includes("dummy") || enemyType.includes("target")) {
      isDummy = true;
      maxHp = 9999;
      name = "Kukła Treningowa";
    } else if (enemyType.includes("boss") || enemyType.includes("sentinel_boss")) {
      maxHp = 600;
      width = 56;
      height = 70;
      name = "Bastion Sentinel Boss";
    } else if (enemyType.includes("gargoyle") || enemyType.includes("wisp")) {
      isAerial = true;
      maxHp = 120;
      width = 32;
      height = 36;
    } else if (enemyType.includes("crawler")) {
      maxHp = 90;
      width = 44;
      height = 28;
    } else {
      maxHp = 150;
      width = 38;
      height = 52;
    }

    const newEnemy: Enemy = {
      id,
      defaultName: name,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      width,
      height,
      health: maxHp,
      maxHealth: maxHp,
      isDead: false,
      patrolMinX: Math.max(0, spawnX - 200),
      patrolMaxX: Math.min(this.levelWidth, spawnX + 200),
      facingLeft: true,
      isDummy,
      damageTimer: 0,
      isAerial,
    };

    this.enemies.push(newEnemy);
    this.particleSystem.spawnBurst(spawnX + width / 2, spawnY + height / 2, "#f43f5e", "magic", 20);
    this.audio.playSFX(SoundType.SFX_SKILL_UNLOCK);
    this.notifyReact();
  }

  public refillVitals(playerIndex: number = 0) {
    const player = this.players[playerIndex];
    if (player) {
      player.health = player.maxHealth;
      player.mana = player.maxMana;
      player.stamina = player.maxStamina;
      player.isDead = false;
      this.particleSystem.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, "#22c55e", "spark", 15);
      this.audio.playSFX(SoundType.SFX_POTION);
      this.notifyReact();
    }
  }

  public setPlayerStat(
    playerIndex: number,
    stat: "health" | "maxHealth" | "mana" | "maxMana" | "stamina" | "maxStamina",
    value: number
  ) {
    const player = this.players[playerIndex];
    if (!player) return;
    const clamped = Math.max(1, Math.min(9999, Math.round(value)));
    player[stat] = clamped;
    if (stat === "maxHealth" && player.health > clamped) player.health = clamped;
    if (stat === "maxMana" && player.mana > clamped) player.mana = clamped;
    if (stat === "maxStamina" && player.stamina > clamped) player.stamina = clamped;
    this.notifyReact();
  }

  public unlockAllSkills(playerIndex: number = 0) {
    const player = this.players[playerIndex];
    if (!player) return;
    const allSpellIds = Object.keys(SPELL_REGISTRY);
    player.unlockedSkills = Array.from(new Set([...player.unlockedSkills, ...allSpellIds]));
    player.skillPoints = Math.max(player.skillPoints, 10);
    this.particleSystem.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, "#facc15", "magic", 25);
    this.audio.playSFX(SoundType.SFX_SKILL_UNLOCK);
    this.notifyReact();
  }

  public giveAllWeapons(playerIndex: number = 0) {
    const player = this.players[playerIndex];
    if (!player) return;
    const weapons = Object.values(ITEM_REGISTRY).filter((item) => item.type === "weapon");
    weapons.forEach((w) => {
      // Find empty slot
      const emptyIdx = player.inventory.backpack.findIndex((s) => s === null);
      if (emptyIdx !== -1) {
        player.inventory.backpack[emptyIdx] = { ...w };
      }
    });
    this.particleSystem.spawnBurst(player.x + player.width / 2, player.y + player.height / 2, "#fbbf24", "spark", 20);
    this.audio.playSFX(SoundType.SFX_SAVE);
    this.notifyReact();
  }

  public givePotions(playerIndex: number = 0) {
    const player = this.players[playerIndex];
    if (!player) return;
    player.inventory.quickPotions = [
      ITEM_REGISTRY.potion_health ? { ...ITEM_REGISTRY.potion_health, count: 5 } : null,
      ITEM_REGISTRY.potion_mana ? { ...ITEM_REGISTRY.potion_mana, count: 5 } : null,
      ITEM_REGISTRY.potion_elixir ? { ...ITEM_REGISTRY.potion_elixir, count: 5 } : null,
    ];
    this.audio.playSFX(SoundType.SFX_POTION);
    this.notifyReact();
  }

  public addGold(amount: number) {
    statsManager.addXp(PlayerId.Player1, amount);
    const p1 = this.players[0];
    if (p1) {
      p1.skillPoints = (p1.skillPoints || 0) + Math.max(1, Math.round(amount / 500));
    }
    this.audio.playSFX(SoundType.SFX_UNLOCK);
    this.notifyReact();
  }

  public clearInventory(playerIndex: number = 0) {
    const player = this.players[playerIndex];
    if (!player) return;
    player.inventory.backpack = Array(12).fill(null);
    this.audio.playSFX(SoundType.SFX_HIT);
    this.notifyReact();
  }

  public forceVictory() {
    this.isVictory = true;
    this.triggerNarration("trainingGoalSuccess");
    this.audio.playSFX(SoundType.SFX_SKILL_UNLOCK);
    this.stop();
    this.notifyReact();
  }

  public forceDefeat() {
    const p1 = this.players[0];
    if (p1) {
      p1.health = 0;
      p1.isDead = true;
    }
    this.isDefeat = true;
    this.triggerNarration("defeat");
    this.audio.playSFX(SoundType.SFX_HIT);
    this.notifyReact();
  }

  public stepSingleFrame() {
    const wasPaused = this.isPaused;
    this.isPaused = false;
    this.tick(1.0);
    this.isPaused = wasPaused;
    this.notifyReact();
  }

  public triggerParticleBurst(type: "dust" | "spark" | "magic", count: number = 25) {
    const p1 = this.players[0];
    const x = p1 ? p1.x + p1.width / 2 : this.levelWidth / 2;
    const y = p1 ? p1.y + p1.height / 2 : this.levelHeight / 2;
    const color =
      type === "spark"
        ? "#f59e0b"
        : type === "magic"
        ? "#a855f7"
        : "#d97706";
    this.particleSystem.spawnBurst(x, y, color, type, count);
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
