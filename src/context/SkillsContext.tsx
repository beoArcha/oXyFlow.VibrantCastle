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
  p1?: Player;
  p2?: Player;
  isTwoPlayer: boolean;
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

  const p1 = useMemo(() => engine.players[0], [engine.players, stateVersion]);
  const p2 = useMemo(() => engine.players[1], [engine.players, stateVersion]);
  const isTwoPlayer = useMemo(() => engine.players.length > 1, [engine.players, stateVersion]);

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
  }, [skillTreeNodes, selectedSkillId]);

  const selectedNode = useMemo(() => {
    if (!selectedSkillId) return undefined;
    return getSkillNodeById(selectedSkillId);
  }, [selectedSkillId]);

  const unlockedSkills = useMemo(() => {
    return activePlayer?.unlockedSkills || [];
  }, [activePlayer?.unlockedSkills]);

  const skillPoints = activePlayer?.skillPoints ?? 0;
  const primarySpellId = activePlayer?.primarySpellId || "";
  const secondarySpellId = activePlayer?.secondarySpellId || "";

  const getTargetPlayer = useCallback(
    (playerIndex?: number): Player | undefined => {
      const pIdx = typeof playerIndex === "number" ? playerIndex : activePlayerIndex;
      if (!isValidPlayerIndex(engine.players, pIdx)) {
        return undefined;
      }
      return engine.players[pIdx];
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
        return { success: false, messageKey: "noActivePlayer" };
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
      p1,
      p2,
      isTwoPlayer,
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
      p1,
      p2,
      isTwoPlayer,
    ]
  );

  return <SkillsContext.Provider value={value}>{children}</SkillsContext.Provider>;
};

/**
 * Hook to consume the skills context.
 * Throws MissingContextProviderError if used outside of SkillsProvider.
 */
export const useSkills = (): SkillsContextValue => {
  const context = useContext(SkillsContext);
  if (!context) {
    throw new MissingContextProviderError("useSkills", "SkillsProvider");
  }
  return context;
};
