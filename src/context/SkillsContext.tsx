import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { IPlayerScopedContext, EngineBoundProviderProps } from "./IContext";
import { useEngineSubscription } from "./hooks/useEngineSubscription";
import { GameEngine } from "@game/loop/engine";
import { Player, SkillTreeNode } from "@game/types";
import {
  getSkillTreeNodesForCharacter,
  getSkillNodeById,
  checkSkillUnlockConditions,
  getCharacterKey,
} from "@game/logic/skills";
import { MissingContextProviderError } from "@lib/errors";
import { resolveActivePlayer, isValidPlayerIndex } from "./utils/playerResolver";

export interface SkillUnlockEvaluation {
  canUnlock: boolean;
  isUnlocked: boolean;
  hasPrerequisite: boolean;
  hasPoints: boolean;
  reqSkillNode?: SkillTreeNode;
  reasonKey?: string;
}

/**
 * Public contract for skill tree domain UI state and actions.
 */
export interface SkillsContextValue extends IPlayerScopedContext {
  activeCharacter: "valen" | "aurelia";
  skillTreeNodes: SkillTreeNode[];
  selectedSkillId: string | null;
  setSelectedSkillId: (id: string | null) => void;
  selectedNode: SkillTreeNode | undefined;
  unlockedSkills: string[];
  skillPoints: number;
  primarySpellId: string;
  secondarySpellId: string;
  unlockSkill: (nodeId: string, playerIndex?: number) => { success: boolean; messageKey?: string };
  assignSpell: (spellId: string, slot: "primary" | "secondary", playerIndex?: number) => boolean;
  evaluateSkill: (nodeId: string, playerIndex?: number) => SkillUnlockEvaluation;
}

const SkillsContext = createContext<SkillsContextValue | null>(null);

export interface SkillsProviderProps extends EngineBoundProviderProps {}

/**
 * Context provider managing the character skill tree domain, unlock conditions,
 * and active spell slots bound to the GameEngine instance.
 */
export const SkillsProvider: React.FC<SkillsProviderProps> = ({ children, engine }) => {
  const isLoaded = true;
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [stateVersion, setStateVersion] = useState(0);

  useEngineSubscription(() => {
    setStateVersion((v) => v + 1);
  }, engine);

  const activePlayer = useMemo(() => {
    const raw = resolveActivePlayer(engine.players, activePlayerIndex, { allowFallback: true });
    if (!raw) return undefined;
    return {
      ...raw,
      unlockedSkills: [...raw.unlockedSkills],
    };
  }, [engine.players, activePlayerIndex, stateVersion]);

  const activeCharacter = useMemo(() => {
    return getCharacterKey(activePlayer?.characterId || "valen");
  }, [activePlayer?.characterId]);

  const skillTreeNodes = useMemo(() => {
    return getSkillTreeNodesForCharacter(activeCharacter);
  }, [activeCharacter]);

  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(() => {
    return skillTreeNodes[0]?.id || null;
  });

  useEffect(() => {
    if (skillTreeNodes.length > 0) {
      if (!selectedSkillId || !skillTreeNodes.some((n) => n.id === selectedSkillId)) {
        setSelectedSkillId(skillTreeNodes[0].id);
      }
    }
  }, [activeCharacter, skillTreeNodes, selectedSkillId]);

  const selectedNode = useMemo(() => {
    if (!selectedSkillId) return undefined;
    return getSkillNodeById(selectedSkillId);
  }, [selectedSkillId]);

  const unlockedSkills = useMemo(() => {
    return activePlayer?.unlockedSkills || [];
  }, [activePlayer?.unlockedSkills, stateVersion]);

  const skillPoints = useMemo(() => {
    return activePlayer?.skillPoints ?? 0;
  }, [activePlayer?.skillPoints, stateVersion]);

  const primarySpellId = useMemo(() => {
    return activePlayer?.primarySpellId || "";
  }, [activePlayer?.primarySpellId, stateVersion]);

  const secondarySpellId = useMemo(() => {
    return activePlayer?.secondarySpellId || "";
  }, [activePlayer?.secondarySpellId, stateVersion]);

  const getTargetPlayer = useCallback(
    (index?: number): Player | undefined => {
      const idx = typeof index === "number" ? index : activePlayerIndex;
      return resolveActivePlayer(engine.players, idx, { allowFallback: typeof index !== "number" });
    },
    [engine.players, activePlayerIndex]
  );

  const evaluateSkill = useCallback(
    (nodeId: string, playerIndex?: number): SkillUnlockEvaluation => {
      const player = getTargetPlayer(playerIndex);
      if (!player) {
        return {
          canUnlock: false,
          isUnlocked: false,
          hasPrerequisite: false,
          hasPoints: false,
          reasonKey: "noSkillFound",
        };
      }
      return checkSkillUnlockConditions(player, nodeId);
    },
    [getTargetPlayer]
  );

  const unlockSkill = useCallback(
    (nodeId: string, playerIndex?: number): { success: boolean; messageKey?: string } => {
      const pIdx = typeof playerIndex === "number" ? playerIndex : activePlayerIndex;
      if (!isValidPlayerIndex(engine.players, pIdx)) {
        return { success: false, messageKey: "invalidPlayerIndex" };
      }
      return engine.unlockPlayerSkill(pIdx, nodeId);
    },
    [engine, activePlayerIndex]
  );

  const assignSpell = useCallback(
    (spellId: string, slot: "primary" | "secondary", playerIndex?: number): boolean => {
      const pIdx = typeof playerIndex === "number" ? playerIndex : activePlayerIndex;
      if (!isValidPlayerIndex(engine.players, pIdx)) {
        return false;
      }
      return engine.assignPlayerSpell(pIdx, spellId, slot);
    },
    [engine, activePlayerIndex]
  );

  const resetToDefaults = useCallback(() => {
    engine.resetPlayerSkillsToDefaults();
    setActivePlayerIndex(0);
  }, [engine]);

  const value = useMemo<SkillsContextValue>(
    () => ({
      isLoaded,
      resetToDefaults,
      activePlayerIndex,
      setActivePlayerIndex,
      activePlayer,
      activeCharacter,
      skillTreeNodes,
      selectedSkillId,
      setSelectedSkillId,
      selectedNode,
      unlockedSkills,
      skillPoints,
      primarySpellId,
      secondarySpellId,
      unlockSkill,
      assignSpell,
      evaluateSkill,
    }),
    [
      isLoaded,
      resetToDefaults,
      activePlayerIndex,
      setActivePlayerIndex,
      activePlayer,
      activeCharacter,
      skillTreeNodes,
      selectedSkillId,
      setSelectedSkillId,
      selectedNode,
      unlockedSkills,
      skillPoints,
      primarySpellId,
      secondarySpellId,
      unlockSkill,
      assignSpell,
      evaluateSkill,
    ]
  );

  return (
    <SkillsContext.Provider value={value}>
      {children}
    </SkillsContext.Provider>
  );
};

/**
 * Hook providing access to character skill progression, unlocks, and spell bindings.
 * Canonical hook complying with frontend_ui.md.
 *
 * @throws {MissingContextProviderError} when used outside a SkillsProvider.
 */
export function useSkills(): SkillsContextValue {
  const context = useContext(SkillsContext);
  if (!context) {
    throw new MissingContextProviderError("useSkills", "SkillsProvider");
  }
  return context;
}
