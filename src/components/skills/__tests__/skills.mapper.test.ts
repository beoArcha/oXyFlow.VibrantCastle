import { describe, it, expect } from "bun:test";
import { MagicCategory, MagicTriggerType, SkillTreeNode } from "@game/types";
import { SkillUnlockEvaluation } from "@context/SkillsContext";
import {
  formatFramesDuration,
  toSkillNodeVM,
  toSkillRestrictionVM,
  toSkillDetailVM,
  createSkillCategoryGroups,
  toSkillTreeDagVM,
} from "../skills.mapper";

describe("skills.mapper", () => {
  const mockOffensiveNode: SkillTreeNode = {
    id: "skill_fireball",
    skill: {
      id: "spell_fireball",
      nameKey: "spellSolarFireballName",
      descriptionKey: "spellSolarFireballDesc",
      category: MagicCategory.Offensive,
      triggerType: MagicTriggerType.Action,
      manaCost: 20,
      staminaCost: 0,
      cooldownFrames: 120,
      damage: 35,
      color: "#ffaa00",
      iconName: "Flame",
      character: "valen",
      minLevel: 2,
      shieldDurationFrames: 0,
      autoIntervalFrames: 0,
    },
    reqSkillId: "skill_aether_bolt",
    pointCost: 2,
    unlocked: false,
    tier: 2,
    character: "valen",
    restrictionKey: "restrictionValenSolarFireball",
    gridX: 1,
    gridY: 1,
  };

  const mockDefensiveNode: SkillTreeNode = {
    id: "skill_shield",
    skill: {
      id: "spell_shield",
      nameKey: "spellPrismaticShieldName",
      descriptionKey: "spellPrismaticShieldDesc",
      category: MagicCategory.Defensive,
      triggerType: MagicTriggerType.Action,
      manaCost: 15,
      staminaCost: 0,
      cooldownFrames: 300,
      damage: 0,
      color: "#3399ff",
      iconName: "Shield",
      character: "valen",
      shieldDurationFrames: 180,
    },
    reqSkillId: null,
    pointCost: 1,
    unlocked: true,
    tier: 1,
    character: "valen",
    gridX: 0,
    gridY: 0,
  };

  const mockPassiveNode: SkillTreeNode = {
    id: "skill_mana_font",
    skill: {
      id: "spell_mana_font",
      nameKey: "spellManaFontName",
      descriptionKey: "spellManaFontDesc",
      category: MagicCategory.Defensive,
      triggerType: MagicTriggerType.Passive,
      manaCost: 0,
      staminaCost: 0,
      cooldownFrames: 0,
      damage: 0,
      color: "#aa00ff",
      iconName: "Zap",
      character: "aurelia",
      autoIntervalFrames: 150,
    },
    reqSkillId: null,
    pointCost: 3,
    unlocked: false,
    tier: 3,
    character: "aurelia",
    gridX: 2,
    gridY: 2,
  };

  describe("formatFramesDuration", () => {
    it("formats frames into seconds with one decimal point", () => {
      expect(formatFramesDuration(60)).toBe("1.0s");
      expect(formatFramesDuration(120)).toBe("2.0s");
      expect(formatFramesDuration(90)).toBe("1.5s");
      expect(formatFramesDuration(0)).toBe("0.0s");
    });
  });

  describe("toSkillNodeVM", () => {
    it("transforms SkillTreeNode into SkillNodeVM with unlock and equip states", () => {
      const evaluation: SkillUnlockEvaluation = {
        canUnlock: true,
        isUnlocked: false,
        hasPrerequisite: true,
        hasPoints: true,
      };

      const vm = toSkillNodeVM(mockOffensiveNode, evaluation, true, false);

      expect(vm.id).toBe("skill_fireball");
      expect(vm.nameKey).toBe("spellSolarFireballName");
      expect(vm.iconName).toBe("Flame");
      expect(vm.pointCost).toBe(2);
      expect(vm.tier).toBe(2);
      expect(vm.isUnlocked).toBe(false);
      expect(vm.isUnlockable).toBe(true);
      expect(vm.isPrimary).toBe(true);
      expect(vm.isSecondary).toBe(false);
    });
  });

  describe("toSkillRestrictionVM", () => {
    it("transforms restriction information for Valen with missing prerequisites", () => {
      const reqNode: SkillTreeNode = {
        ...mockDefensiveNode,
        id: "skill_aether_bolt",
      };

      const evaluation: SkillUnlockEvaluation = {
        canUnlock: false,
        isUnlocked: false,
        hasPrerequisite: false,
        hasPoints: true,
        reqSkillNode: reqNode,
      };

      const vm = toSkillRestrictionVM(mockOffensiveNode, evaluation, 5);

      expect(vm.characterName).toBe("Valen");
      expect(vm.disciplineKey).toBe("restrictionCharacterValen");
      expect(vm.restrictionKey).toBe("restrictionValenSolarFireball");
      expect(vm.reqSkillNameKey).toBe("spellPrismaticShieldName");
      expect(vm.hasPrerequisite).toBe(false);
      expect(vm.hasPoints).toBe(true);
      expect(vm.pointCost).toBe(2);
      expect(vm.availablePoints).toBe(5);
      expect(vm.isUnavailable).toBe(true);
    });

    it("transforms restriction information for Aurelia when unlocked", () => {
      const evaluation: SkillUnlockEvaluation = {
        canUnlock: false,
        isUnlocked: true,
        hasPrerequisite: true,
        hasPoints: true,
      };

      const vm = toSkillRestrictionVM(mockPassiveNode, evaluation, 1);

      expect(vm.characterName).toBe("Aurelia");
      expect(vm.disciplineKey).toBe("restrictionCharacterAurelia");
      expect(vm.hasPrerequisite).toBe(true);
      expect(vm.isUnavailable).toBe(false);
    });
  });

  describe("toSkillDetailVM", () => {
    it("creates comprehensive SkillDetailVM with formatted properties", () => {
      const evaluation: SkillUnlockEvaluation = {
        canUnlock: true,
        isUnlocked: false,
        hasPrerequisite: true,
        hasPoints: true,
      };

      const vm = toSkillDetailVM(
        mockOffensiveNode,
        evaluation,
        4,
        false,
        true,
        "PM"
      );

      expect(vm.id).toBe("skill_fireball");
      expect(vm.nameKey).toBe("spellSolarFireballName");
      expect(vm.descriptionKey).toBe("spellSolarFireballDesc");
      expect(vm.iconName).toBe("Flame");
      expect(vm.pointCost).toBe(2);
      expect(vm.isUnlocked).toBe(false);
      expect(vm.canUnlock).toBe(true);
      expect(vm.isPrimary).toBe(false);
      expect(vm.isSecondary).toBe(true);
      expect(vm.isAction).toBe(true);
      expect(vm.isPassive).toBe(false);
      expect(vm.isAuto).toBe(false);

      const manaProp = vm.properties.find((p) => p.labelKey === "manaCostLabel");
      expect(manaProp).toBeDefined();
      expect(manaProp?.value).toBe("20 PM");

      const dmgProp = vm.properties.find((p) => p.labelKey === "damageLabel");
      expect(dmgProp).toBeDefined();
      expect(dmgProp?.value).toBe("+35");

      const cdProp = vm.properties.find((p) => p.labelKey === "cooldownLabel");
      expect(cdProp).toBeDefined();
      expect(cdProp?.value).toBe("2.0s");
    });

    it("correctly includes shieldDurationFrames and autoIntervalFrames in properties", () => {
      const evaluation: SkillUnlockEvaluation = {
        canUnlock: false,
        isUnlocked: true,
        hasPrerequisite: true,
        hasPoints: true,
      };

      const vm = toSkillDetailVM(mockDefensiveNode, evaluation, 0, false, false);
      const shieldProp = vm.properties.find((p) => p.labelKey === "shieldDurationLabel");
      expect(shieldProp).toBeDefined();
      expect(shieldProp?.value).toBe("3.0s");
    });
  });

  describe("createSkillCategoryGroups", () => {
    it("groups nodes into offensive, defensive, and passive categories sorted by tier", () => {
      const nodes = [mockPassiveNode, mockOffensiveNode, mockDefensiveNode];
      const evaluate = (id: string): SkillUnlockEvaluation => ({
        canUnlock: true,
        isUnlocked: id === "skill_shield",
        hasPrerequisite: true,
        hasPoints: true,
      });

      const groups = createSkillCategoryGroups(
        nodes,
        evaluate,
        "skill_shield",
        "skill_fireball"
      );

      expect(groups).toHaveLength(3);

      const offensiveGroup = groups.find((g) => g.key === "offensive");
      expect(offensiveGroup).toBeDefined();
      expect(offensiveGroup?.labelKey).toBe("offensiveCategory");
      expect(offensiveGroup?.iconType).toBe("flame");
      expect(offensiveGroup?.nodes).toHaveLength(1);
      expect(offensiveGroup?.nodes[0].id).toBe("skill_fireball");

      const defensiveGroup = groups.find((g) => g.key === "defensive");
      expect(defensiveGroup).toBeDefined();
      expect(defensiveGroup?.labelKey).toBe("defensiveCategory");
      expect(defensiveGroup?.iconType).toBe("shield");
      expect(defensiveGroup?.nodes).toHaveLength(1);
      expect(defensiveGroup?.nodes[0].id).toBe("skill_shield");

      const passiveGroup = groups.find((g) => g.key === "passive");
      expect(passiveGroup).toBeDefined();
      expect(passiveGroup?.labelKey).toBe("passiveCategory");
      expect(passiveGroup?.iconType).toBe("zap");
      expect(passiveGroup?.nodes).toHaveLength(1);
      expect(passiveGroup?.nodes[0].id).toBe("skill_mana_font");
    });
  });

  describe("toSkillTreeDagVM", () => {
    it("maps a DAG skill tree to SkillTreeDagVM with sorted tiers and prerequisite links", () => {
      const mockTree = {
        treeId: "solar_duelist",
        nameKey: "treeValenSolarDuelist",
        icon: "Swords",
        rootSkillIds: ["skill_starter"],
        nodes: {
          skill_starter: {
            skillId: "skill_starter",
            tier: 1,
            pointCost: 1,
            prerequisites: [],
            gridPosition: { x: 1, y: 1 },
          },
          skill_fireball: {
            skillId: "skill_fireball",
            tier: 2,
            pointCost: 2,
            prerequisites: ["skill_starter"],
            gridPosition: { x: 2, y: 1 },
          },
        },
      };

      const nodesLookup: Record<string, SkillTreeNode> = {
        skill_fireball: mockOffensiveNode,
      };

      const evaluate = (id: string): SkillUnlockEvaluation => ({
        isUnlocked: id === "skill_starter",
        canUnlock: id === "skill_fireball",
        hasPrerequisite: true,
        hasPoints: true,
      });

      const dagVM = toSkillTreeDagVM(
        mockTree,
        nodesLookup,
        evaluate,
        "skill_starter",
        ""
      );

      expect(dagVM.treeId).toBe("solar_duelist");
      expect(dagVM.nameKey).toBe("treeValenSolarDuelist");
      expect(dagVM.nodes).toHaveLength(2);

      // Verify node 0 (tier 1)
      const rootNode = dagVM.nodes[0];
      expect(rootNode.id).toBe("skill_starter");
      expect(rootNode.tier).toBe(1);
      expect(rootNode.isUnlocked).toBe(true);
      expect(rootNode.isPrimary).toBe(true);
      expect(rootNode.prerequisites).toEqual([]);

      // Verify node 1 (tier 2)
      const childNode = dagVM.nodes[1];
      expect(childNode.id).toBe("skill_fireball");
      expect(childNode.tier).toBe(2);
      expect(childNode.nameKey).toBe("spellSolarFireballName");
      expect(childNode.isUnlockable).toBe(true);
      expect(childNode.prerequisites).toEqual(["skill_starter"]);
    });
  });
});
