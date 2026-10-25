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

export interface SkillTreeDagNodeVM extends SkillNodeVM {
  readonly prerequisites: readonly string[];
  readonly gridPosition: { readonly x: number; readonly y: number };
}

export interface SkillTreeDagVM {
  readonly treeId: string;
  readonly nameKey: string;
  readonly icon: string;
  readonly rootSkillIds: readonly string[];
  readonly nodes: readonly SkillTreeDagNodeVM[];
}
