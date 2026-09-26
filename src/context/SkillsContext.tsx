import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { ILoadableContext, IResettableContext } from "./IContext";
import { useEngineSubscription } from "./useEngineSubscription";
import { GameEngine } from "../game/loop/engine";
import { Player, SkillTreeNode } from "../game/types";
import {
  getSkillTreeNodesForCharacter,
  getSkillNodeById,
  checkSkillUnlockConditions,
  getCharacterKey
} from "../game/logic/skills";
import { MissingContextProviderError } from "../lib/errors";

export interface SkillsCharacterState {
  unlockedSkills: string[];
  skillPoints: number;
  primarySpellId: string;
  secondarySpellId: string;
}

export interface SkillsContextState {
  p1Skills: SkillsCharacterState;
  p2Skills?: SkillsCharacterState;
  activePlayerIndex: number;
}

export interface SkillUnlockEvaluation {
  canUnlock: boolean;
  isUnlocked: boolean;
  hasPrerequisite: boolean;
  hasPoints: boolean;
  reqSkillNode?: SkillTreeNode;
  reasonKey?: string;
}

export interface SkillsContextValue extends ILoadableContext, IResettableContext {
  activePlayerIndex: number;
  setActivePlayerIndex: (idx: number) => void;
  activePlayer: Player | undefined;
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

export interface SkillsProviderProps {
  children: React.ReactNode;
  engine: GameEngine;
}

export const SkillsProvider: React.FC<SkillsProviderProps> = ({ children, engine }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [stateVersion, setStateVersion] = useState(0);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Subscribe to engine tick/state notifications
  useEngineSubscription(() => {
    setStateVersion((v) => v + 1);
  }, engine);

  const activePlayer = useMemo(() => {
    if (activePlayerIndex === 1 && engine.players[1]) {
      return engine.players[1];
    }
    return engine.players[0];
  }, [engine.players, activePlayerIndex, stateVersion]);

  const activeCharacter = useMemo<"valen" | "aurelia">(() => {
    return getCharacterKey(activePlayer?.id || "valen");
  }, [activePlayer]);

  const skillTreeNodes = useMemo(() => {
    return getSkillTreeNodesForCharacter(activeCharacter);
  }, [activeCharacter]);

  // Set default selected skill on character switch or start
  useEffect(() => {
    if (skillTreeNodes.length > 0) {
      if (!selectedSkillId || !skillTreeNodes.some(n => n.id === selectedSkillId)) {
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
      return engine.players[idx] || engine.players[0];
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
          reasonKey: "noSkillFound"
        };
      }
      return checkSkillUnlockConditions(player, nodeId);
    },
    [getTargetPlayer]
  );

  const unlockSkill = useCallback(
    (nodeId: string, playerIndex?: number): { success: boolean; messageKey?: string } => {
      const pIdx = typeof playerIndex === "number" ? playerIndex : activePlayerIndex;
      const result = engine.unlockPlayerSkill(pIdx, nodeId);
      if (result.success) {
        setStateVersion((v) => v + 1);
      }
      return result;
    },
    [engine, activePlayerIndex]
  );

  const assignSpell = useCallback(
    (spellId: string, slot: "primary" | "secondary", playerIndex?: number): boolean => {
      const pIdx = typeof playerIndex === "number" ? playerIndex : activePlayerIndex;
      const success = engine.assignPlayerSpell(pIdx, spellId, slot);
      if (success) {
        setStateVersion((v) => v + 1);
      }
      return success;
    },
    [engine, activePlayerIndex]
  );

  // === Capability methods (IResettableContext) ===
  const resetToDefaults = useCallback(() => {
    engine.resetPlayerSkillsToDefaults();
    setActivePlayerIndex(0);
    setStateVersion((v) => v + 1);
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
      evaluateSkill
    }),
    [
      isLoaded,
      resetToDefaults,
      activePlayerIndex,
      activePlayer,
      activeCharacter,
      skillTreeNodes,
      selectedSkillId,
      selectedNode,
      unlockedSkills,
      skillPoints,
      primarySpellId,
      secondarySpellId,
      unlockSkill,
      assignSpell,
      evaluateSkill
    ]
  );

  return <SkillsContext.Provider value={value}>{children}</SkillsContext.Provider>;
};

export const useSkills = (): SkillsContextValue => {
  const ctx = useContext(SkillsContext);
  if (!ctx) {
    throw new MissingContextProviderError("useSkills", "SkillsProvider");
  }
  return ctx;
};

export default SkillsContext;
