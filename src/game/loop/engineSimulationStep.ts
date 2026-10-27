import { Player, Enemy, Entity, Projectile } from "@game/types";
import { ICombatSystem } from "../engine/combatSystem";
import { GamePhysicsEngine } from "../physics/physics";
import { CameraManager } from "../engine/cameraManager";
import { ParticleSystem } from "../engine/particleSystem";
import { ICollisionEngine } from "../physics/collisions";
import { GameAudioEngine } from "@game/engine/audioEngine";
import { IEnemyAISystem } from "../engine/enemyAISystem";
import { IEnvironmentCollisionSystem } from "../physics/environmentCollisionSystem";
import { ILevelLifecycleManager } from "../locations/levelLifecycleManager";
import { INarrationSystem } from "../engine/narrationSystem";
import { debugManager } from "../debug/debugManager";
import { LocationDefinition } from "../locations";

export interface IEngineSimulationContext {
  getPlayers(): Player[];
  getEnemies(): Enemy[];
  getEntities(): Entity[];
  getProjectiles(): Projectile[];
  setProjectiles(projectiles: Projectile[]): void;
  combatSystem: ICombatSystem;
  physics: GamePhysicsEngine;
  cameraManager: CameraManager;
  particleSystem: ParticleSystem;
  collisions: ICollisionEngine;
  audio: GameAudioEngine;
  enemyAISystem: IEnemyAISystem;
  environmentCollisionSystem: IEnvironmentCollisionSystem;
  levelLifecycleManager: ILevelLifecycleManager;
  narrationSystem: INarrationSystem;
  getLevelDimensions(): { width: number; height: number };
  getPortalCooldownTimer(): number;
  getCurrentLocation(): LocationDefinition | undefined;
  triggerNarration(key: string): void;
  notifyReact(): void;
}

/**
 * Coordinates world simulation step: combat resolution, enemy AI, platform kinematics,
 * environmental collisions, adaptive audio scoring, and particle/narration timers.
 */
export class EngineSimulationStep {
  constructor(private readonly context: IEngineSimulationContext) {}

  public execute(
    effectiveDt: number,
    stepMultiplier: number,
    anyPlayerAttacking: boolean
  ): void {
    const players = this.context.getPlayers();
    const enemies = this.context.getEnemies();
    const entities = this.context.getEntities();
    let projectiles = this.context.getProjectiles();
    const { width: levelWidth } = this.context.getLevelDimensions();

    this.context.combatSystem.processAutoSkills(
      players,
      enemies,
      projectiles,
      stepMultiplier,
      this.context.audio
    );

    if (players.length > 1) {
      this.context.physics.resolvePlayerPlayerCollision(players, stepMultiplier);
    }

    const combatContext = {
      cameraManager: this.context.cameraManager,
      particleSystem: this.context.particleSystem,
      collisionEngine: this.context.collisions,
      audio: this.context.audio,
      triggerNarration: (id: string) => this.context.triggerNarration(id),
      onLeverActivated: (id: string) => this.context.levelLifecycleManager.handleLeverUnlocks(id),
    };

    if (anyPlayerAttacking) {
      this.context.combatSystem.processMeleeAttacks(players, enemies, entities, combatContext);
    }

    projectiles = this.context.combatSystem.updateProjectiles(
      projectiles,
      players,
      enemies,
      entities,
      effectiveDt,
      levelWidth,
      this.context.getLevelDimensions().height,
      combatContext
    );
    this.context.setProjectiles(projectiles);

    let anyEnemyAggro = false;
    if (!debugManager.state.freezeAI) {
      anyEnemyAggro = this.context.enemyAISystem.update(
        enemies,
        players,
        this.context.physics,
        effectiveDt
      );
    }

    this.context.physics.updateEntities(entities, effectiveDt, players);

    this.resolveCollisions(players, entities, levelWidth);

    if (this.context.levelLifecycleManager.consumeLevelTransitionPending()) {
      return;
    }

    this.modulateMusic(anyEnemyAggro, anyPlayerAttacking, projectiles.length > 0);

    this.context.particleSystem.update(this.context.cameraManager.x);

    if (this.context.narrationSystem.update(stepMultiplier)) {
      this.context.notifyReact();
    }
  }

  private resolveCollisions(players: Player[], entities: Entity[], levelWidth: number): void {
    this.context.environmentCollisionSystem.resolveEnvironmentCollisions(
      players,
      entities,
      levelWidth,
      this.context.getPortalCooldownTimer(),
      {
        collisionEngine: this.context.collisions,
        triggerNarration: (id: string) => this.context.triggerNarration(id),
        onGoalReached: (goalEntity?: Entity) =>
          this.context.levelLifecycleManager.handleGoalCompletion(goalEntity),
        onLeverActivated: (id: string) =>
          this.context.levelLifecycleManager.handleLeverUnlocks(id),
        spawnBurst: (x, y, color, type, count) =>
          this.context.particleSystem.spawnBurst(x, y, color, type, count),
        isNoClip: () => !!debugManager.state.noClip,
        isLevelTransitionPending: () => this.context.levelLifecycleManager.isLevelTransitionPending,
      }
    );
  }

  private modulateMusic(hasAggro: boolean, isAttacking: boolean, hasProjectiles: boolean): void {
    if (hasAggro || isAttacking || hasProjectiles) {
      this.context.audio.setMusicIntensity(0.7);
    } else {
      const location = this.context.getCurrentLocation();
      this.context.audio.setMusicIntensity(location?.theme.musicIntensity || 0.1);
    }
  }
}
