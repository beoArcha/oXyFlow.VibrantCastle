import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VALEN_SKILL_TREE_NODES,
  AURELIA_SKILL_TREE_NODES,
  ALL_SKILL_TREE_NODES,
  getSkillTreeNodesForCharacter,
  getSkillNodeById,
  checkSkillUnlockConditions,
  unlockSkillNode,
  getCharacterKey
} from "../skills";
import { PlayerId, AnimationState, Player } from "../../types";
import { gameAudio } from "../../engine/audioEngine";

describe("skills.ts - Unified skills.json Loader and Skill Tree Logic", () => {
  beforeEach(() => {
    vi.spyOn(gameAudio, "playSFX").mockImplementation(() => {});
  });

  describe("Skill Tree Node Segregation and Loading", () => {
    it("should load Valen skill nodes from unified skills.json", () => {
      expect(VALEN_SKILL_TREE_NODES.length).toBeGreaterThan(0);
      expect(VALEN_SKILL_TREE_NODES.every(node => node.character === "valen")).toBe(true);
    });

    it("should load Aurelia skill nodes from unified skills.json", () => {
      expect(AURELIA_SKILL_TREE_NODES.length).toBeGreaterThan(0);
      expect(AURELIA_SKILL_TREE_NODES.every(node => node.character === "aurelia")).toBe(true);
    });

    it("should combine all nodes in ALL_SKILL_TREE_NODES without duplicates", () => {
      expect(ALL_SKILL_TREE_NODES.length).toBe(
        VALEN_SKILL_TREE_NODES.length + AURELIA_SKILL_TREE_NODES.length
      );
      const ids = ALL_SKILL_TREE_NODES.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should retrieve character nodes accurately via getSkillTreeNodesForCharacter", () => {
      const valenNodes = getSkillTreeNodesForCharacter("valen");
      const aureliaNodes = getSkillTreeNodesForCharacter("aurelia");
      const p1Nodes = getSkillTreeNodesForCharacter(PlayerId.Player1);
      const p2Nodes = getSkillTreeNodesForCharacter(PlayerId.Player2);

      expect(valenNodes).toBe(VALEN_SKILL_TREE_NODES);
      expect(p1Nodes).toBe(VALEN_SKILL_TREE_NODES);
      expect(aureliaNodes).toBe(AURELIA_SKILL_TREE_NODES);
      expect(p2Nodes).toBe(AURELIA_SKILL_TREE_NODES);
    });

    it("should map character keys accurately", () => {
      expect(getCharacterKey("valen")).toBe("valen");
      expect(getCharacterKey(PlayerId.Player1)).toBe("valen");
      expect(getCharacterKey("aurelia")).toBe("aurelia");
      expect(getCharacterKey(PlayerId.Player2)).toBe("aurelia");
    });
  });

  describe("Graph Prerequisite and Node Lookup", () => {
    it("should find nodes by ID via getSkillNodeById", () => {
      const solarFlare = getSkillNodeById("solar_flare");
      expect(solarFlare).toBeDefined();
      expect(solarFlare?.character).toBe("valen");

      const aetherBolt = getSkillNodeById("aether_bolt");
      expect(aetherBolt).toBeDefined();
      expect(aetherBolt?.character).toBe("aurelia");
    });

    it("should return undefined for unknown skill IDs", () => {
      expect(getSkillNodeById("non_existent_spell")).toBeUndefined();
    });

    it("should ensure all prerequisites refer to valid existing skill IDs", () => {
      const allIds = new Set(ALL_SKILL_TREE_NODES.map(n => n.id));
      for (const node of ALL_SKILL_TREE_NODES) {
        if (node.reqSkillId) {
          expect(allIds.has(node.reqSkillId)).toBe(true);
        }
      }
    });
  });

  describe("Skill Unlock Conditions and Execution", () => {
    const createMockPlayer = (overrides?: Partial<Player>): Player => ({
      id: PlayerId.Player1,
      characterId: "valen",
      characterName: "Valen",
      characterTier: 1,
      levelGroup: 1,
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      width: 32,
      height: 48,
      facingLeft: false,
      isGrounded: true,
      isCrouching: false,
      isJumping: false,
      wasGrounded: true,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      jumpHoldTimer: 0,
      squashStretchScaleX: 1,
      squashStretchScaleY: 1,
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      stamina: 100,
      maxStamina: 100,
      isDead: false,
      attackCooldown: 0,
      dashCooldown: 0,
      isDashing: false,
      isBackstepping: false,
      dashTime: 0,
      isAttacking: false,
      attackTime: 0,
      magicCooldown: 0,
      isCasting: false,
      castTime: 0,
      shieldActiveTime: 0,
      primarySpellId: "solar_flare",
      secondarySpellId: "",
      skillPoints: 3,
      score: 0,
      unlockedSkills: ["solar_flare"],
      autoSkillTimer: 0,
      inventory: { slots: [], equipment: {} as any },
      animationState: AnimationState.Idle,
      ...overrides
    });

    it("should reject unlock for non-existent skill ID", () => {
      const player = createMockPlayer();
      const check = checkSkillUnlockConditions(player, "bogus_skill");
      expect(check.canUnlock).toBe(false);
      expect(check.reasonKey).toBe("noSkillFound");

      const result = unlockSkillNode(player, "bogus_skill");
      expect(result.success).toBe(false);
      expect(result.messageKey).toBe("noSkillFound");
    });

    it("should report already unlocked skill", () => {
      const player = createMockPlayer({ unlockedSkills: ["solar_flare"] });
      const check = checkSkillUnlockConditions(player, "solar_flare");
      expect(check.canUnlock).toBe(false);
      expect(check.isUnlocked).toBe(true);
      expect(check.reasonKey).toBe("skillUnlocked");
    });

    it("should reject unlock if prerequisite is missing", () => {
      // radiant_strike requires solar_fireball
      const player = createMockPlayer({ unlockedSkills: ["solar_flare"], skillPoints: 5 });
      const check = checkSkillUnlockConditions(player, "radiant_strike");
      expect(check.canUnlock).toBe(false);
      expect(check.hasPrerequisite).toBe(false);
      expect(check.reasonKey).toBe("reqPrerequisite");
    });

    it("should reject unlock if insufficient skill points", () => {
      // solar_fireball requires 2 skill points, prerequisites: solar_flare
      const player = createMockPlayer({ unlockedSkills: ["solar_flare"], skillPoints: 1 });
      const check = checkSkillUnlockConditions(player, "solar_fireball");
      expect(check.canUnlock).toBe(false);
      expect(check.hasPoints).toBe(false);
      expect(check.reasonKey).toBe("notEnoughPoints");
    });

    it("should successfully unlock when prerequisites and points are satisfied", () => {
      const player = createMockPlayer({ unlockedSkills: ["solar_flare"], skillPoints: 3 });
      const check = checkSkillUnlockConditions(player, "solar_fireball");
      expect(check.canUnlock).toBe(true);

      const result = unlockSkillNode(player, "solar_fireball");
      expect(result.success).toBe(true);
      expect(player.unlockedSkills).toContain("solar_fireball");
      expect(player.skillPoints).toBe(1); // 3 - 2
    });
  });
});
