import { Player, InputMap, SoundType } from "../types";
import { calculatePlayerDerivedStats } from "../logic/inventory";

/**
 * Audio interface for player action SFX.
 */
export interface IPlayerControllerAudio {
  playSFX(type: SoundType): void;
}

/**
 * Interface for managing player states, action triggers, and resource lifecycles.
 */
export interface IPlayerController {
  updateResourcesAndActions(
    player: Player,
    inputs: InputMap,
    dtMultiplier: number,
    audio?: IPlayerControllerAudio
  ): void;
}

/**
 * PlayerController encapsulates resource regeneration (stamina, mana),
 * action cooldowns, and combat action triggers (attacks, slide/backstep).
 * Decouples game logic and combat triggers from kinematic physics.
 */
export class PlayerController implements IPlayerController {
  private readonly slideDuration: number = 13;
  private readonly backstepDuration: number = 10;
  private readonly dashStaminaCost: number = 18;

  public updateResourcesAndActions(
    player: Player,
    inputs: InputMap,
    dtMultiplier: number = 1.0,
    audio?: IPlayerControllerAudio
  ): void {
    if (player.isDead) return;

    const stats = calculatePlayerDerivedStats(player);

    // 1. Natural Resource Regeneration (when not performing intensive maneuvers)
    if (!player.isDashing && !player.isBackstepping) {
      player.stamina = Math.min(
        player.maxStamina,
        player.stamina + stats.staminaRegen * dtMultiplier
      );
    }
    player.mana = Math.min(
      player.maxMana,
      player.mana + stats.manaRegen * dtMultiplier
    );

    // 2. Decrement Active Timers and Action Durations
    if (player.attackCooldown > 0) {
      player.attackCooldown = Math.max(0, player.attackCooldown - dtMultiplier);
    }
    if (player.dashCooldown > 0) {
      player.dashCooldown = Math.max(0, player.dashCooldown - dtMultiplier);
    }
    if (player.magicCooldown > 0) {
      player.magicCooldown = Math.max(0, player.magicCooldown - dtMultiplier);
    }
    if (player.shieldActiveTime > 0) {
      player.shieldActiveTime = Math.max(0, player.shieldActiveTime - dtMultiplier);
    }

    if (player.isAttacking) {
      player.attackTime = Math.max(0, player.attackTime - dtMultiplier);
      if (player.attackTime <= 0) {
        player.isAttacking = false;
      }
    }

    if (player.isCasting) {
      player.castTime = Math.max(0, player.castTime - dtMultiplier);
      if (player.castTime <= 0) {
        player.isCasting = false;
      }
    }

    // 3. Trigger Slide or Backstep Maneuver (Action 2)
    if (inputs.action2 && player.dashCooldown <= 0 && !player.isDashing && !player.isBackstepping) {
      if (player.stamina >= this.dashStaminaCost) {
        player.stamina -= this.dashStaminaCost;

        // Determine if player is pressing OPPOSITE to facing direction (Backstep) or FORWARD (Slide)
        const pressingOpposite =
          (player.facingLeft && inputs.right) || (!player.facingLeft && inputs.left);

        if (pressingOpposite) {
          // Lekki Odskok (Backstep)
          player.isBackstepping = true;
          player.isDashing = false;
          player.dashTime = this.backstepDuration;
          player.dashCooldown = 32;
          player.vy = -2.2; // slight hop
          player.isGrounded = false;
        } else {
          // Ślizg w kierunku ruchu (Forward Slide)
          player.isDashing = true;
          player.isBackstepping = false;
          player.dashTime = this.slideDuration;
          player.dashCooldown = 38;
          player.vy = 0;
        }

        if (audio) {
          audio.playSFX(SoundType.SFX_DASH);
        }
      }
    }

    // 4. Trigger Melee Attack (Action 1)
    if (inputs.action1 && player.attackCooldown <= 0 && !player.isAttacking) {
      player.isAttacking = true;
      player.attackTime = 14;
      player.attackCooldown = 20;
      if (audio) {
        audio.playSFX(SoundType.SFX_SLASH);
      }
    }
  }
}

export const defaultPlayerController = new PlayerController();
