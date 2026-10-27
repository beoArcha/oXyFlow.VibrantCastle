import { SkillTreeNode, Player, SoundType, PlayerId, MagicCategory, MagicTriggerType } from "../types";
import { SPELL_REGISTRY } from "./magic";
import { gameAudio } from "../engine/audioEngine";
import { calculatePlayerDerivedStats } from "./inventory";
import skillsData from "@data/skills/skills.json";

interface ISkillNodeJson {
  id: string;
  nameKey?: string;
  descKey?: string;
  restrictionKey?: string;
  category?: string;
  triggerType?: string;
  manaCost?: number;
  staminaCost?: number;
  cooldownFrames?: number;
  damage?: number;
  color?: string;
  icon?: string;
  projectileSpeed?: number;
  shieldDurationFrames?: number;
  autoIntervalFrames?: number;
  reqSkillId?: string | null;
  pointCost?: number;
  unlocked?: boolean;
  tier?: number;
  minLevel?: number;
  gridX?: number;
  gridY?: number;
}

function parseJsonToNodes(data: readonly ISkillNodeJson[], character: "valen" | "aurelia"): SkillTreeNode[] {
  return data.map(item => {
    const spell = SPELL_REGISTRY[item.id] || {
      id: item.id,
      nameKey: item.nameKey,
      descriptionKey: item.descKey,
      character,
      restrictionKey: item.restrictionKey,
      category: item.category === "defensive" ? MagicCategory.Defensive : MagicCategory.Offensive,
      triggerType: item.triggerType === "passive"
        ? MagicTriggerType.Passive
        : item.triggerType === "automatic"
          ? MagicTriggerType.Automatic
          : MagicTriggerType.Action,
      manaCost: item.manaCost ?? 0,
      staminaCost: item.staminaCost ?? 0,
      cooldownFrames: item.cooldownFrames ?? 0,
      damage: item.damage ?? 0,
      color: item.color || "#fbbf24",
      iconName: item.icon || "Zap",
      projectileSpeed: item.projectileSpeed,
      shieldDurationFrames: item.shieldDurationFrames,
      autoIntervalFrames: item.autoIntervalFrames
    };

    return {
      id: item.id,
      skill: spell,
      reqSkillId: item.reqSkillId ?? null,
      pointCost: item.pointCost ?? 1,
      unlocked: item.unlocked ?? false,
      tier: item.tier ?? 1,
      character,
      restrictionKey: item.restrictionKey,
      minLevel: item.minLevel ?? item.tier ?? 1,
      gridX: item.gridX ?? 1,
      gridY: item.gridY ?? 1
    };
  });
}

export const VALEN_SKILL_TREE_NODES: SkillTreeNode[] = parseJsonToNodes(skillsData.valen, "valen");
export const AURELIA_SKILL_TREE_NODES: SkillTreeNode[] = parseJsonToNodes(skillsData.aurelia, "aurelia");

export const ALL_SKILL_TREE_NODES: SkillTreeNode[] = [
  ...VALEN_SKILL_TREE_NODES,
  ...AURELIA_SKILL_TREE_NODES
];

// Backwards compatibility export
export const SKILL_TREE_NODES: SkillTreeNode[] = VALEN_SKILL_TREE_NODES;

/**
 * Returns the character identifier ("valen" | "aurelia") from player or ID
 */
export function getCharacterKey(playerIdOrChar: PlayerId | "valen" | "aurelia"): "valen" | "aurelia" {
  if (playerIdOrChar === PlayerId.Player2 || playerIdOrChar === "aurelia") {
    return "aurelia";
  }
  return "valen";
}

/**
 * Retrieves the skill tree nodes corresponding to a specific character.
 */
export function getSkillTreeNodesForCharacter(character: "valen" | "aurelia" | PlayerId): SkillTreeNode[] {
  const char = getCharacterKey(character);
  return char === "aurelia" ? AURELIA_SKILL_TREE_NODES : VALEN_SKILL_TREE_NODES;
}

/**
 * Finds a skill node by its ID across all characters.
 */
export function getSkillNodeById(skillId: string): SkillTreeNode | undefined {
  return ALL_SKILL_TREE_NODES.find(n => n.id === skillId);
}

/**
 * Checks if a player can unlock a given skill node.
 */
export function checkSkillUnlockConditions(
  player: Player,
  nodeId: string
): {
  canUnlock: boolean;
  isUnlocked: boolean;
  hasPrerequisite: boolean;
  hasPoints: boolean;
  reqSkillNode?: SkillTreeNode;
  reasonKey?: string;
} {
  const node = getSkillNodeById(nodeId);
  if (!node) {
    return {
      canUnlock: false,
      isUnlocked: false,
      hasPrerequisite: false,
      hasPoints: false,
      reasonKey: "noSkillFound"
    };
  }

  const isUnlocked = player.unlockedSkills.includes(nodeId);
  const reqSkillNode = node.reqSkillId ? getSkillNodeById(node.reqSkillId) : undefined;
  const hasPrerequisite = !node.reqSkillId || player.unlockedSkills.includes(node.reqSkillId);
  const hasPoints = player.skillPoints >= node.pointCost;

  if (isUnlocked) {
    return { canUnlock: false, isUnlocked: true, hasPrerequisite, hasPoints, reqSkillNode, reasonKey: "skillUnlocked" };
  }

  if (!hasPrerequisite) {
    return { canUnlock: false, isUnlocked: false, hasPrerequisite: false, hasPoints, reqSkillNode, reasonKey: "reqPrerequisite" };
  }

  if (!hasPoints) {
    return { canUnlock: false, isUnlocked: false, hasPrerequisite: true, hasPoints: false, reqSkillNode, reasonKey: "notEnoughPoints" };
  }

  return {
    canUnlock: true,
    isUnlocked: false,
    hasPrerequisite: true,
    hasPoints: true,
    reqSkillNode
  };
}

/**
 * Unlocks a skill node if player has sufficient points and prerequisites met.
 */
export function unlockSkillNode(player: Player, nodeId: string): { success: boolean; messageKey?: string } {
  const check = checkSkillUnlockConditions(player, nodeId);
  const node = getSkillNodeById(nodeId);

  if (!check.canUnlock || !node) {
    return { success: false, messageKey: check.reasonKey || "noSkillFound" };
  }

  player.skillPoints -= node.pointCost;
  player.unlockedSkills.push(nodeId);
  gameAudio.playSFX(SoundType.SFX_SKILL_UNLOCK);

  // Recalculate stats if passive skill
  const stats = calculatePlayerDerivedStats(player);
  player.maxHealth = stats.maxHp;
  player.maxMana = stats.maxMana;
  player.maxStamina = stats.maxStamina;

  return { success: true, messageKey: "skillUnlocked" };
}

/**
 * Assigns an unlocked action spell to Primary or Secondary magic slot.
 */
export function assignSpellToSlot(player: Player, spellId: string, slot: "primary" | "secondary"): boolean {
  if (!player.unlockedSkills.includes(spellId)) return false;
  const spell = SPELL_REGISTRY[spellId];
  if (!spell || spell.triggerType !== MagicTriggerType.Action) return false;

  if (slot === "primary") {
    player.primarySpellId = spellId;
  } else {
    player.secondarySpellId = spellId;
  }
  gameAudio.playSFX(SoundType.SFX_UNLOCK);
  return true;
}

/**
 * Returns default starter skill progression for character
 */
export function getDefaultSkillsForCharacter(character: "valen" | "aurelia"): {
  unlockedSkills: string[];
  primarySpellId: string;
  secondarySpellId: string;
  skillPoints: number;
} {
  if (character === "aurelia") {
    return {
      unlockedSkills: ["arcane_missiles", "ice_barrier"],
      primarySpellId: "arcane_missiles",
      secondarySpellId: "ice_barrier",
      skillPoints: 4
    };
  }

  return {
    unlockedSkills: ["solar_flare", "aegis_ward"],
    primarySpellId: "solar_flare",
    secondarySpellId: "aegis_ward",
    skillPoints: 4
  };
}
