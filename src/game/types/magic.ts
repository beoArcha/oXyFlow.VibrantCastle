import { MagicCategory, MagicTriggerType, PlayerId } from "./enums";

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
  gridX: number;
  gridY: number;
}
