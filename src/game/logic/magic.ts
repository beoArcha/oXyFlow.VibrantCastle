import { Projectile, Player, InputMap, SoundType } from "@game/types";
import { gameAudio } from "@game/engine/audioEngine";
import { SPELL_REGISTRY } from "@game/data/spells";
import { Result, ok, err, GameplayError, ErrorCode } from "@lib/errors";
import { magicLogger } from "@game/logger/gameLogger";

// Re-export SPELL_REGISTRY for backward compatibility with existing UI components
export { SPELL_REGISTRY };

export interface IMagicAudio {
  playSFX(type: SoundType): void;
}

export interface CastOutcome {
  projectiles: Projectile[];
  spellId: string;
  isDefensive: boolean;
  manaConsumed: number;
  staminaConsumed: number;
}

/**
 * Calculates shooting trajectory and projectile angles based on user inputs.
 */
export function calculateAimAngle(player: Player, inputs: InputMap): { angleRad: number; label: string } {
  const isMoving = Math.abs(player.vx) > 0.3 || inputs.left || inputs.right;
  const isFacingLeft = player.facingLeft;

  if (inputs.up) {
    if (isMoving) {
      return { angleRad: (-45 * Math.PI / 180) * (isFacingLeft ? -1 : 1) - (isFacingLeft ? Math.PI : 0), label: "45_up" };
    } else {
      return { angleRad: -Math.PI / 2, label: "90_up" };
    }
  }

  if (inputs.down) {
    if (isMoving) {
      return { angleRad: (45 * Math.PI / 180) * (isFacingLeft ? -1 : 1) + (isFacingLeft ? Math.PI : 0), label: "45_down" };
    } else {
      return { angleRad: Math.PI / 2, label: "90_down" };
    }
  }

  return {
    angleRad: isFacingLeft ? Math.PI : 0,
    label: "horizontal"
  };
}

/**
 * Attempts to cast a spell, checking cooldowns, resources and generating projectile/defense outcomes.
 * Returns a typed Result<CastOutcome, GameplayError> eliminating Nil/Boolean blindness.
 */
export function attemptCastSpell(
  player: Player,
  spellId: string,
  inputs: InputMap,
  audio: IMagicAudio = gameAudio
): Result<CastOutcome, GameplayError> {
  const skill = SPELL_REGISTRY[spellId];
  if (!skill) {
    const error = new GameplayError(`Spell with id '${spellId}' is not registered`, ErrorCode.GAMEPLAY_INVALID_ACTION, {
      details: { spellId, playerId: player.id },
    });
    magicLogger.warn("Attempted to cast unregistered spell", error.toLogContext(), error);
    return err(error);
  }

  // Check cooldown
  if (player.magicCooldown > 0) {
    const error = new GameplayError("Spell is currently on cooldown", ErrorCode.GAMEPLAY_COOLDOWN_ACTIVE, {
      details: { spellId, cooldownFrames: player.magicCooldown, playerId: player.id },
    });
    magicLogger.warn("Spell is currently on cooldown", error.toLogContext(), error);
    return err(error);
  }

  // Check mana
  if (player.mana < skill.manaCost) {
    const error = new GameplayError("Insufficient mana to cast spell", ErrorCode.GAMEPLAY_INSUFFICIENT_MANA, {
      details: {
        spellId,
        required: skill.manaCost,
        requiredMana: skill.manaCost,
        current: player.mana,
        currentMana: player.mana,
        playerId: player.id,
      },
    });
    magicLogger.warn("Insufficient mana to cast spell", error.toLogContext(), error);
    return err(error);
  }

  // Check stamina
  if (player.stamina < skill.staminaCost) {
    const error = new GameplayError("Insufficient stamina to cast spell", ErrorCode.GAMEPLAY_INSUFFICIENT_RESOURCE, {
      details: {
        spellId,
        required: skill.staminaCost,
        requiredStamina: skill.staminaCost,
        current: player.stamina,
        currentStamina: player.stamina,
        playerId: player.id,
      },
    });
    magicLogger.warn("Insufficient stamina to cast spell", error.toLogContext(), error);
    return err(error);
  }

  // Consume resources
  player.mana -= skill.manaCost;
  player.stamina -= skill.staminaCost;
  player.magicCooldown = skill.cooldownFrames;
  player.isCasting = true;
  player.castTime = 16;

  // Handle Defensive Shield / Barrier spells
  if (skill.shieldDurationFrames && skill.shieldDurationFrames > 0) {
    player.shieldActiveTime = skill.shieldDurationFrames;
    audio.playSFX(SoundType.SFX_MAGIC_SHIELD);
    magicLogger.debug("Cast defensive spell", {
      spellId,
      playerId: player.id,
      shieldDurationFrames: skill.shieldDurationFrames,
      manaCost: skill.manaCost,
      staminaCost: skill.staminaCost,
    });
    return ok({
      projectiles: [],
      spellId,
      isDefensive: true,
      manaConsumed: skill.manaCost,
      staminaConsumed: skill.staminaCost,
    });
  }

  // Handle Offensive Projectile spells
  audio.playSFX(SoundType.SFX_MAGIC_BOLT);

  const aim = calculateAimAngle(player, inputs);
  const speed = skill.projectileSpeed || 8.0;

  const startX = player.x + player.width / 2;
  const startY = player.isCrouching ? player.y + player.height * 0.75 : player.y + player.height * 0.4;

  const projectiles: Projectile[] = [];

  if (skill.id === "frost_nova") {
    // 8-way burst around player
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        ownerId: player.id,
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 7,
        damage: skill.damage,
        color: skill.color,
        life: 0,
        maxLife: 35,
        skillId: skill.id
      });
    }
  } else if (
    skill.id === "radiant_strike" ||
    skill.id === "emerald_barrage" ||
    skill.id === "arcane_missiles"
  ) {
    // 3-spread shot
    [-0.2, 0, 0.2].forEach(spread => {
      const finalAngle = aim.angleRad + spread;
      projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        ownerId: player.id,
        x: startX,
        y: startY,
        vx: Math.cos(finalAngle) * speed,
        vy: Math.sin(finalAngle) * speed,
        radius: 6,
        damage: Math.round(skill.damage / 2),
        color: skill.color,
        life: 0,
        maxLife: 60,
        skillId: skill.id
      });
    });
  } else {
    // Single targeted missile (solar_flare, solar_conflagration, astral_singularity, etc.)
    const isLarge =
      skill.id === "solar_conflagration" ||
      skill.id === "astral_singularity" ||
      skill.id === "solar_fireball" ||
      skill.id === "celestial_comet";

    projectiles.push({
      id: `proj_${Date.now()}_${Math.random()}`,
      ownerId: player.id,
      x: startX,
      y: startY,
      vx: Math.cos(aim.angleRad) * speed,
      vy: Math.sin(aim.angleRad) * speed,
      radius: isLarge ? 12 : 7,
      damage: skill.damage,
      color: skill.color,
      life: 0,
      maxLife: 70,
      skillId: skill.id
    });
  }

  magicLogger.debug("Cast offensive spell", {
    spellId,
    playerId: player.id,
    projectileCount: projectiles.length,
    manaCost: skill.manaCost,
    staminaCost: skill.staminaCost,
  });

  return ok({
    projectiles,
    spellId,
    isDefensive: false,
    manaConsumed: skill.manaCost,
    staminaConsumed: skill.staminaCost,
  });
}

/**
 * Casts a spell from player, consumes Mana & Stamina, and generates projectile or defensive ward.
 * Backwards-compatible wrapper returning the projectiles array directly.
 */
export function castMagicSpell(
  player: Player,
  spellId: string,
  inputs: InputMap,
  audio: IMagicAudio = gameAudio
): Projectile[] {
  const result = attemptCastSpell(player, spellId, inputs, audio);
  return result.ok ? result.value.projectiles : [];
}
