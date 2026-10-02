import type { GameTranslationDictionary } from "@i18n/types";
import type { GameSessionStats } from "./logic/stats/statsTypes";
import type { AssetQuality } from "../types/assets";

/**
 * Shared types, interfaces, and enums for the 2D Game Engine.
 * Adheres strictly to SOLID principles and typescript standards.
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum PlayerId {
  Player1 = "player1",
  Player2 = "player2",
}

export enum AnimationState {
  Idle = "idle",
  Crouch = "crouch",
  Run = "run",
  Jump = "jump",
  Fall = "fall",
  Attack = "attack",
  Dash = "dash",
  Slide = "slide",
  Backstep = "backstep",
  Cast = "cast",
  Hit = "hit",
  Dead = "dead",
}

export enum SoundType {
  BGM_EXPLORE = "bgm_explore",
  BGM_COMBAT = "bgm_combat",
  SFX_JUMP = "sfx_jump",
  SFX_SLASH = "sfx_slash",
  SFX_DASH = "sfx_dash",
  SFX_HIT = "sfx_hit",
  SFX_SAVE = "sfx_save",
  SFX_UNLOCK = "sfx_unlock",
  SFX_MAGIC_BOLT = "sfx_magic_bolt",
  SFX_MAGIC_SHIELD = "sfx_magic_shield",
  SFX_POTION = "sfx_potion",
  SFX_SKILL_UNLOCK = "sfx_skill_unlock",
  SFX_SPELL_CAST = "sfx_magic_bolt",
  SFX_LEVEL_CLEAR = "sfx_save",
  SFX_LEVER = "sfx_unlock",
  SFX_DEFEAT = "sfx_hit",
  SFX_BUTTON_CLICK = "sfx_potion",
}

export enum CollisionType {
  Solid = "solid", // standard platforms, walls
  OneWay = "oneway", // can jump up through, solid from top
  Hazard = "hazard", // thorns, acid spikes
  Trigger = "trigger", // narration / event triggers
  Lever = "lever", // interactive switches
  Goal = "goal", // gate/portal to victory
}

// Magic system categorizations
export enum MagicCategory {
  Offensive = "offensive",
  Defensive = "defensive",
}

export enum MagicTriggerType {
  Action = "action", // Cast manually by player
  Automatic = "automatic", // Triggers on interval / reaction
  Passive = "passive", // Always active stat/aura
}

export interface MagicSkill {
  id: string;
  nameKey: string;
  descriptionKey: string;
  category: MagicCategory;
  triggerType: MagicTriggerType;
  manaCost: number;
  staminaCost: number;
  cooldownFrames: number;
  damage: number;
  color: string;
  iconName: string;
  character?: "valen" | "aurelia";
  restrictionKey?: string;
  minLevel?: number;
  projectileSpeed?: number;
  shieldDurationFrames?: number;
  healAmount?: number;
  autoIntervalFrames?: number;
}

export interface Projectile {
  id: string;
  ownerId: PlayerId;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
  maxLife: number;
  skillId: string;
}

// Item & Baldur's Gate 2 style Inventory
export enum ItemType {
  Weapon = "weapon",
  Shield = "shield",
  Helmet = "helmet",
  Armor = "armor",
  Amulet = "amulet",
  Ring = "ring",
  Potion = "potion",
}

// ==========================================
// Item & Inventory Segregated Interfaces (ISP)
// ==========================================

export type ItemRarity = "common" | "uncommon" | "rare" | "legendary";

export interface ItemBase {
  id: string;
  nameKey: string;
  descriptionKey: string;
  type: ItemType;
  icon: string;
  rarity: ItemRarity;
}

export interface ICombatModifiers {
  attackBonus?: number;
  defenseBonus?: number;
  maxHpBonus?: number;
  maxManaBonus?: number;
  maxStaminaBonus?: number;
  manaRegenBonus?: number;
  staminaRegenBonus?: number;
}

export interface IPotionEffects {
  healHp?: number;
  healMana?: number;
  healStamina?: number;
  count?: number; // stack count for potions
}

export interface Item extends ItemBase, ICombatModifiers, IPotionEffects { }

export interface EquipmentState {
  mainHand: Item | null;
  offHand: Item | null;
  helmet: Item | null;
  armor: Item | null;
  amulet: Item | null;
  ring: Item | null;
}

export interface InventoryState {
  equipment: EquipmentState;
  quickPotions: (Item | null)[]; // 3 quick slots for potions (BG2 style belt)
  backpack: (Item | null)[]; // 16 grid backpack slots
}

// Skill Tree Node
export interface SkillTreeNode {
  id: string;
  skill: MagicSkill;
  reqSkillId: string | null;
  pointCost: number;
  unlocked: boolean;
  tier: number;
  character?: "valen" | "aurelia";
  restrictionKey?: string;
  minLevel?: number;
  gridX: number; // For visualization
  gridY: number;
}

// ==========================================
// Player & Character Segregated Interfaces (ISP)
// ==========================================

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
  isDummy: boolean; // For combat testing
  damageTimer: number; // For blinking red on hit
  isAerial?: boolean;
  nameKey?: string;
  defaultName?: string;
  templateId?: string; // Links to enemies.json
  animationState?: string; // e.g. "idle", "fly", "hit", "attack", "destroy"
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
  triggerId?: string; // Links to narrative logs or events
  structureId?: string; // Links to structures.json (e.g. "aether_gate", "chrono_lever")
  animationState?: string; // e.g. "inactive", "charging", "activating", "active"
  animationTicks?: number;
  // For portals / transitions (Castlevania-style)
  targetLocationId?: string;
  targetSpawnPoint?: { x: number; y: number };
  portalActivation?: "touch" | "interact";
  particleEffect?: "leaf" | "dust" | "spark" | "magic" | "shield";
  portalColors?: {
    inner: string;
    outer: string;
    border: string;
  };
  // For moving platforms
  vx?: number;
  vy?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: "leaf" | "spark" | "dust" | "magic" | "shield";
}

export interface InputMap {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  action1: boolean; // Sword Attack
  action2: boolean; // Dash / Slide / Backstep
  magic1: boolean; // Primary Magic Skill
  magic2: boolean; // Secondary Magic Skill
  potion1: boolean; // Quick Potion 1
  potion2: boolean; // Quick Potion 2
  potion3: boolean; // Quick Potion 3
}

export interface SaveState {
  timestamp: string;
  p1Health: number;
  p1Mana: number;
  p1Stamina: number;
  p1Score: number;
  p1SkillPoints: number;
  p1UnlockedSkills: string[];
  p1PrimarySpellId?: string;
  p1SecondarySpellId?: string;
  p1Inventory?: InventoryState;
  p2Health: number;
  p2Mana: number;
  p2Stamina: number;
  p2Score: number;
  p2SkillPoints?: number;
  p2UnlockedSkills?: string[];
  p2PrimarySpellId?: string;
  p2SecondarySpellId?: string;
  p2Inventory?: InventoryState;
  levelId: string;
  activatedLevers: string[];
  defeatedEnemies: string[];
  checkpointX: number;
  checkpointY: number;
  stats?: GameSessionStats;
}

export interface GamepadBindingMap {
  jump: number; // Button index (default 0 - A / Cross)
  action1: number; // Sword Attack (default 2 - X / Square)
  action2: number; // Dash / Slide (default 1 - B / Circle)
  magic1: number; // Primary Spell (default 3 - Y / Triangle)
  magic2: number; // Secondary Spell (default 5 - RB / R1)
  potion1: number; // Potion 1 (default 4 - LB / L1)
  potion2: number; // Potion 2 (default 6 - LT / L2)
  potion3: number; // Potion 3 (default 7 - RT / R2)
}

export type { AssetQuality };
export type AspectRatioMode = "16:10" | "16:9" | "4:3" | "auto";
export type ScalingFilterMode = "smooth" | "pixel";
export type TargetFps = 30 | 60 | 90 | 120;

export interface DisplaySettings {
  aspectRatio: AspectRatioMode;
  scalingFilter: ScalingFilterMode;
  assetQuality: AssetQuality;
  targetFps: TargetFps;
  showFpsCounter?: boolean;
  hardwareAcceleration?: boolean;
}

export interface GameSettings {
  language: "pl" | "en";
  volumeMusic: number;
  volumeSFX: number;
  isTwoPlayer: boolean;
  display: DisplaySettings;
}

export type KeyAction = keyof InputMap;

export type TranslationDictionary = GameTranslationDictionary;
export type { GameTranslationDictionary };
