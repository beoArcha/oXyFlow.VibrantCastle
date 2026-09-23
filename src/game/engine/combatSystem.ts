import { Player, Enemy, Entity, Projectile, SoundType, CollisionType } from "../types";
import { statsManager } from "../logic/stats";
import { calculatePlayerDerivedStats } from "../logic/inventory";
import { CameraManager } from "./cameraManager";
import { ParticleSystem } from "./particleSystem";
import { ICollisionEngine } from "../physics/collisions";

export interface ICombatAudio {
  playSFX(sound: SoundType): void;
}

export interface ICombatContext {
  cameraManager: CameraManager;
  particleSystem: ParticleSystem;
  collisionEngine: ICollisionEngine;
  audio: ICombatAudio;
  triggerNarration: (key: string) => void;
  onLeverActivated: (triggerId: string) => void;
}

export interface ICombatSystem {
  processMeleeAttacks(
    players: Player[],
    enemies: Enemy[],
    entities: Entity[],
    context: ICombatContext
  ): void;

  updateProjectiles(
    projectiles: Projectile[],
    players: Player[],
    enemies: Enemy[],
    entities: Entity[],
    dtMultiplier: number,
    levelWidth: number,
    levelHeight: number,
    context: ICombatContext
  ): Projectile[];

  processAutoSkills(
    players: Player[],
    enemies: Enemy[],
    projectiles: Projectile[],
    dtMultiplier: number,
    audio: ICombatAudio
  ): void;
}

/**
 * CombatSystem
 * Encapsulates melee sword strikes, projectile dynamics, auto-skills, and damage resolution.
 * Strictly adheres to Single Responsibility Principle (SRP) by decoupling combat logic
 * from the main GameEngine loop.
 */
export class CombatSystem implements ICombatSystem {
  public processMeleeAttacks(
    players: Player[],
    enemies: Enemy[],
    entities: Entity[],
    context: ICombatContext
  ): void {
    players.forEach((player) => {
      if (!player.isAttacking) return;

      const swordReach = 40;
      const attackBox = {
        x: player.facingLeft ? player.x - swordReach : player.x + player.width,
        y: player.y,
        width: swordReach,
        height: player.height,
      };

      const stats = calculatePlayerDerivedStats(player);
      const weaponId = (player.inventory.equipment.mainHand?.id as any) || "solar_rapier";

      // 1. Strike enemies within weapon hitbox
      enemies.forEach((enemy) => {
        if (enemy.isDead) return;

        const isHit =
          attackBox.x < enemy.x + enemy.width &&
          attackBox.x + attackBox.width > enemy.x &&
          attackBox.y < enemy.y + enemy.height &&
          attackBox.y + attackBox.height > enemy.y;

        if (isHit && enemy.damageTimer === 0) {
          const dmg = stats.totalAttack;
          enemy.health = Math.max(0, enemy.health - dmg);
          enemy.damageTimer = 15;
          context.audio.playSFX(SoundType.SFX_HIT);
          statsManager.recordDamageDealt(player.id, dmg, weaponId);
          statsManager.recordSwordStrike(player.id);

          context.cameraManager.triggerShake(7, 4);
          context.particleSystem.spawnBurst(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            "#fbbf24",
            "spark",
            10
          );

          if (enemy.health <= 0) {
            enemy.isDead = true;
            player.score += 150;
            player.skillPoints += 1;
            statsManager.recordKill(player.id, enemy.id);
            context.triggerNarration("narrationEnemyDefeat");
          } else {
            context.triggerNarration("narrationEnemyHit");
          }
        }
      });

      // 2. Check weapon intersections with levers
      entities.forEach((entity) => {
        if (entity.type === CollisionType.Lever && !entity.isActivated) {
          const isHit =
            attackBox.x < entity.x + entity.width &&
            attackBox.x + attackBox.width > entity.x &&
            attackBox.y < entity.y + entity.height &&
            attackBox.y + attackBox.height > entity.y;

          if (isHit) {
            context.collisionEngine.resolve(player, entity, {
              triggerNarration: context.triggerNarration,
              onLeverActivated: context.onLeverActivated,
            });
          }
        }
      });
    });
  }

  public updateProjectiles(
    projectiles: Projectile[],
    players: Player[],
    enemies: Enemy[],
    entities: Entity[],
    dtMultiplier: number,
    levelWidth: number,
    levelHeight: number,
    context: ICombatContext
  ): Projectile[] {
    projectiles.forEach((p) => {
      p.x += p.vx * dtMultiplier;
      p.y += p.vy * dtMultiplier;
      p.life += dtMultiplier;

      // Check collision with enemies
      enemies.forEach((enemy) => {
        if (enemy.isDead) return;
        const hit =
          p.x > enemy.x &&
          p.x < enemy.x + enemy.width &&
          p.y > enemy.y &&
          p.y < enemy.y + enemy.height;

        if (hit && enemy.damageTimer === 0) {
          enemy.health = Math.max(0, enemy.health - p.damage);
          enemy.damageTimer = 15;
          p.life = p.maxLife; // expire projectile
          context.audio.playSFX(SoundType.SFX_HIT);

          const owner = players.find((pl) => pl.id === p.ownerId) || players[0];
          statsManager.recordDamageDealt(owner.id, p.damage, (p.skillId as any) || "other");

          context.cameraManager.triggerShake(8, 5);
          context.particleSystem.spawnBurst(p.x, p.y, p.color, "spark", 12);

          if (enemy.health <= 0) {
            enemy.isDead = true;
            if (owner) {
              owner.score += 150;
              owner.skillPoints += 1;
              statsManager.recordKill(owner.id, enemy.id);
            }
            context.triggerNarration("narrationEnemyDefeat");
          } else {
            context.triggerNarration("narrationEnemyHit");
          }
        }
      });

      // Check collision with levers
      entities.forEach((entity) => {
        if (entity.type === CollisionType.Lever && !entity.isActivated) {
          const hit =
            p.x > entity.x &&
            p.x < entity.x + entity.width &&
            p.y > entity.y &&
            p.y < entity.y + entity.height;
          if (hit) {
            p.life = p.maxLife;
            const owner = players.find((pl) => pl.id === p.ownerId) || players[0];
            context.collisionEngine.resolve(owner, entity, {
              triggerNarration: context.triggerNarration,
              onLeverActivated: context.onLeverActivated,
            });
          }
        }
      });

      // Check collision with Solid walls/platforms
      entities.forEach((entity) => {
        if (entity.type === CollisionType.Solid && entity.y !== -1000) {
          if (
            p.x > entity.x &&
            p.x < entity.x + entity.width &&
            p.y > entity.y &&
            p.y < entity.y + entity.height
          ) {
            p.life = p.maxLife;
            context.particleSystem.spawnBurst(p.x, p.y, p.color, "dust", 6);
          }
        }
      });
    });

    // Return active, non-expired projectiles within bounds
    return projectiles.filter(
      (p) =>
        p.life < p.maxLife &&
        p.x > 0 &&
        p.x < levelWidth &&
        p.y > 0 &&
        p.y < levelHeight
    );
  }

  public processAutoSkills(
    players: Player[],
    enemies: Enemy[],
    projectiles: Projectile[],
    dtMultiplier: number,
    audio: ICombatAudio
  ): void {
    players.forEach((player) => {
      if (player.unlockedSkills.includes("sentinel_spark")) {
        player.autoSkillTimer = (player.autoSkillTimer || 0) + dtMultiplier;
        if (player.autoSkillTimer >= 150) {
          player.autoSkillTimer = 0;
          // Find nearest living enemy within 400px
          const target = enemies.find(
            (e) => !e.isDead && Math.hypot(e.x - player.x, e.y - player.y) < 400
          );
          if (target && player.mana >= 5) {
            player.mana -= 5;
            const angle = Math.atan2(
              target.y + target.height / 2 - (player.y + player.height / 2),
              target.x + target.width / 2 - (player.x + player.width / 2)
            );
            projectiles.push({
              id: `auto_${Date.now()}`,
              ownerId: player.id,
              x: player.x + player.width / 2,
              y: player.y + player.height / 2,
              vx: Math.cos(angle) * 8,
              vy: Math.sin(angle) * 8,
              radius: 5,
              damage: 25,
              color: "#fbbf24",
              life: 0,
              maxLife: 60,
              skillId: "sentinel_spark",
            });
            statsManager.recordSpellCast(player.id);
            audio.playSFX(SoundType.SFX_MAGIC_BOLT);
          }
        }
      }
    });
  }
}
