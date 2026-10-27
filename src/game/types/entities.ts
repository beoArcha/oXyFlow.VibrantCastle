import { AnimationState, CollisionType, PlayerId } from "./enums";
import type { InventoryState } from "./items";

export type PlayerStatKey = "health" | "maxHealth" | "mana" | "maxMana" | "stamina" | "maxStamina";

export interface ICharacterIdentity {
  characterId?: "valen" | "aurelia";
  characterName?: string;
  characterTier?: 1 | 2 | 3;
  levelGroup?: 1 | 2 | 3;
}

export interface ITransform2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facingLeft: boolean;
}

export interface IJumpPhysicsState {
  isGrounded: boolean;
  isCrouching: boolean;
  isJumping: boolean;
  wasGrounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpHoldTimer: number;
  squashStretchScaleX: number;
  squashStretchScaleY: number;
  standingPlatformId?: string | null;
  platformVelocityX?: number;
  platformVelocityY?: number;
}

export interface IVitalResources {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  isDead: boolean;
}

export interface ICombatTimers {
  attackCooldown: number;
  dashCooldown: number;
  isDashing: boolean;
  isBackstepping: boolean;
  dashTime: number;
  isAttacking: boolean;
  attackTime: number;
}

export interface ISpellcasterState {
  magicCooldown: number;
  isCasting: boolean;
  castTime: number;
  shieldActiveTime: number;
  primarySpellId: string;
  secondarySpellId: string;
}

export interface IPlayerProgression {
  skillPoints: number;
  score: number;
  unlockedSkills: string[];
  autoSkillTimer: number;
  inventory: InventoryState;
}

export interface Player
  extends ICharacterIdentity,
    ITransform2D,
    IJumpPhysicsState,
    IVitalResources,
    ICombatTimers,
    ISpellcasterState,
    IPlayerProgression {
  id: PlayerId;
  animationState: AnimationState;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  isDead: boolean;
  patrolMinX: number;
  patrolMaxX: number;
  facingLeft: boolean;
  isDummy: boolean;
  damageTimer: number;
  isAerial?: boolean;
  nameKey?: string;
  defaultName?: string;
  templateId?: string;
  animationState?: string;
  animationTicks?: number;
}

export interface Entity {
  id: string;
  type: CollisionType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  borderColor?: string;
  isActivated?: boolean;
  label?: string;
  labelKey?: string;
  triggerId?: string;
  structureId?: string;
  animationState?: string;
  animationTicks?: number;
  targetLocationId?: string;
  targetSpawnPoint?: { x: number; y: number };
  portalActivation?: "touch" | "interact";
  particleEffect?: "leaf" | "dust" | "spark" | "magic" | "shield";
  portalColors?: {
    inner: string;
    outer: string;
    border: string;
  };
  vx?: number;
  vy?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}
