import { MagicCategory, MagicTriggerType, SkillTreeNode } from "@game/types";
import { SkillUnlockEvaluation } from "@context/SkillsContext";

export interface SkillNodeVM {
  readonly id: string;
  readonly nameKey: string;
  readonly iconName: string;
  readonly pointCost: number;
  readonly tier: number;
  readonly isUnlocked: boolean;
  readonly isUnlockable: boolean;
  readonly isPrimary: boolean;
  readonly isSecondary: boolean;
}

export interface SkillPropertyItemVM {
  readonly id: string;
  readonly labelKey: string;
  readonly value: string;
  readonly colorClass: string;
}

export interface SkillRestrictionVM {
  readonly characterName: "Valen" | "Aurelia";
  readonly disciplineKey: string;
  readonly restrictionKey?: string;
  readonly reqSkillNameKey?: string;
  readonly hasPrerequisite: boolean;
  readonly hasPoints: boolean;
  readonly pointCost: number;
  readonly availablePoints: number;
  readonly isUnavailable: boolean;
}

export interface SkillDetailVM {
  readonly id: string;
  readonly nameKey: string;
  readonly descriptionKey: string;
  readonly iconName: string;
  readonly pointCost: number;
  readonly tier: number;
  readonly isUnlocked: boolean;
  readonly canUnlock: boolean;
  readonly isPrimary: boolean;
  readonly isSecondary: boolean;
  readonly isAction: boolean;
  readonly isPassive: boolean;
  readonly isAuto: boolean;
  readonly properties: readonly SkillPropertyItemVM[];
  readonly restriction: SkillRestrictionVM;
}

export type SkillCategoryType = "offensive" | "defensive" | "passive";

export interface SkillCategoryGroupVM {
  readonly key: SkillCategoryType;
  readonly labelKey: string;
  readonly iconType: "flame" | "shield" | "zap";
  readonly nodes: readonly SkillNodeVM[];
}

export function formatFramesDuration(frames: number, fps = 60): string {
  return `${(frames / fps).toFixed(1)}s`;
}

export function toSkillNodeVM(
  node: SkillTreeNode,
  evalResult: SkillUnlockEvaluation,
  isPrimary: boolean,
  isSecondary: boolean
): SkillNodeVM {
  return {
    id: node.id,
    nameKey: node.skill.nameKey,
    iconName: node.skill.iconName,
    pointCost: node.pointCost,
    tier: node.tier,
    isUnlocked: evalResult.isUnlocked,
    isUnlockable: evalResult.canUnlock,
    isPrimary,
    isSecondary,
  };
}

export function toSkillRestrictionVM(
  node: SkillTreeNode,
  evalResult: SkillUnlockEvaluation,
  skillPoints: number
): SkillRestrictionVM {
  const isCharacterValen = node.character === "valen";
  return {
    characterName: isCharacterValen ? "Valen" : "Aurelia",
    disciplineKey: isCharacterValen
      ? "restrictionCharacterValen"
      : "restrictionCharacterAurelia",
    restrictionKey: node.restrictionKey,
    reqSkillNameKey: evalResult.reqSkillNode?.skill.nameKey,
    hasPrerequisite: evalResult.hasPrerequisite,
    hasPoints: evalResult.hasPoints,
    pointCost: node.pointCost,
    availablePoints: skillPoints,
    isUnavailable: !evalResult.isUnlocked && !evalResult.canUnlock,
  };
}

export function toSkillDetailVM(
  node: SkillTreeNode,
  evalResult: SkillUnlockEvaluation,
  skillPoints: number,
  isPrimary: boolean,
  isSecondary: boolean,
  manaUnit = "PM"
): SkillDetailVM {
  const skill = node.skill;
  const properties: SkillPropertyItemVM[] = [];

  if (skill.manaCost > 0) {
    properties.push({
      id: "manaCost",
      labelKey: "manaCostLabel",
      value: `${skill.manaCost} ${manaUnit}`,
      colorClass: "text-cyan-300",
    });
  }

  if (skill.damage > 0) {
    properties.push({
      id: "damage",
      labelKey: "damageLabel",
      value: `+${skill.damage}`,
      colorClass: "text-amber-300",
    });
  }

  if (skill.cooldownFrames > 0) {
    properties.push({
      id: "cooldown",
      labelKey: "cooldownLabel",
      value: formatFramesDuration(skill.cooldownFrames),
      colorClass: "text-stone-400",
    });
  }

  if (skill.shieldDurationFrames && skill.shieldDurationFrames > 0) {
    properties.push({
      id: "shieldDuration",
      labelKey: "shieldDurationLabel",
      value: formatFramesDuration(skill.shieldDurationFrames),
      colorClass: "text-indigo-300",
    });
  }

  if (skill.autoIntervalFrames && skill.autoIntervalFrames > 0) {
    properties.push({
      id: "autoInterval",
      labelKey: "autoIntervalLabel",
      value: formatFramesDuration(skill.autoIntervalFrames),
      colorClass: "text-yellow-300",
    });
  }

  const isAction = skill.triggerType === MagicTriggerType.Action;
  const isPassive = skill.triggerType === MagicTriggerType.Passive;
  const isAuto = skill.triggerType === MagicTriggerType.Automatic;

  return {
    id: node.id,
    nameKey: skill.nameKey,
    descriptionKey: skill.descriptionKey,
    iconName: skill.iconName,
    pointCost: node.pointCost,
    tier: node.tier,
    isUnlocked: evalResult.isUnlocked,
    canUnlock: evalResult.canUnlock,
    isPrimary,
    isSecondary,
    isAction,
    isPassive,
    isAuto,
    properties,
    restriction: toSkillRestrictionVM(node, evalResult, skillPoints),
  };
}

export function createSkillCategoryGroups(
  nodes: readonly SkillTreeNode[],
  evaluateSkill: (nodeId: string) => SkillUnlockEvaluation,
  primarySpellId: string,
  secondarySpellId: string
): SkillCategoryGroupVM[] {
  const categoryDefinitions = [
    {
      key: "offensive" as const,
      labelKey: "offensiveCategory",
      iconType: "flame" as const,
      match: (n: SkillTreeNode) =>
        n.skill.category === MagicCategory.Offensive &&
        n.skill.triggerType !== MagicTriggerType.Passive,
    },
    {
      key: "defensive" as const,
      labelKey: "defensiveCategory",
      iconType: "shield" as const,
      match: (n: SkillTreeNode) =>
        n.skill.category === MagicCategory.Defensive &&
        n.skill.triggerType !== MagicTriggerType.Passive,
    },
    {
      key: "passive" as const,
      labelKey: "passiveCategory",
      iconType: "zap" as const,
      match: (n: SkillTreeNode) =>
        n.skill.triggerType === MagicTriggerType.Passive,
    },
  ];

  return categoryDefinitions.map((cat) => {
    const catNodes = nodes
      .filter(cat.match)
      .sort((a, b) => a.tier - b.tier)
      .map((node) =>
        toSkillNodeVM(
          node,
          evaluateSkill(node.id),
          primarySpellId === node.id,
          secondarySpellId === node.id
        )
      );

    return {
      key: cat.key,
      labelKey: cat.labelKey,
      iconType: cat.iconType,
      nodes: catNodes,
    };
  });
}
