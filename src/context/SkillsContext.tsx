import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { IContext } from "./IContext";
import { useEngineSubscription } from "./useEngineSubscription";
import { GameEngine } from "../game/loop/engine";
import { Player, SkillTreeNode } from "../game/types";
import {
  getSkillTreeNodesForCharacter,
  getSkillNodeById,
  checkSkillUnlockConditions,
  unlockSkillNode,
  assignSpellToSlot,
  getDefaultSkillsForCharacter,
  getCharacterKey
} from "../game/logic/skills";

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

export interface SkillsContextValue extends IContext<SkillsContextState> {
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

const STORAGE_KEY = "vibrant_castle_skills_context_state";

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
      const player = getTargetPlayer(playerIndex);
      if (!player) return { success: false, messageKey: "noSkillFound" };

      const result = unlockSkillNode(player, nodeId);
      if (result.success) {
        engine.notifyReact();
        setStateVersion((v) => v + 1);
        try {
          // Auto-persist on unlock
          const state: SkillsContextState = {
            p1Skills: {
              unlockedSkills: engine.players[0].unlockedSkills,
              skillPoints: engine.players[0].skillPoints,
              primarySpellId: engine.players[0].primarySpellId,
              secondarySpellId: engine.players[0].secondarySpellId
            },
            p2Skills: engine.players[1]
              ? {
                  unlockedSkills: engine.players[1].unlockedSkills,
                  skillPoints: engine.players[1].skillPoints,
                  primarySpellId: engine.players[1].primarySpellId,
                  secondarySpellId: engine.players[1].secondarySpellId
                }
              : undefined,
            activePlayerIndex
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
          // ignore
        }
      }
      return result;
    },
    [getTargetPlayer, engine, activePlayerIndex]
  );

  const assignSpell = useCallback(
    (spellId: string, slot: "primary" | "secondary", playerIndex?: number): boolean => {
      const player = getTargetPlayer(playerIndex);
      if (!player) return false;

      const success = assignSpellToSlot(player, spellId, slot);
      if (success) {
        engine.notifyReact();
        setStateVersion((v) => v + 1);
        try {
          const state: SkillsContextState = {
            p1Skills: {
              unlockedSkills: engine.players[0].unlockedSkills,
              skillPoints: engine.players[0].skillPoints,
              primarySpellId: engine.players[0].primarySpellId,
              secondarySpellId: engine.players[0].secondarySpellId
            },
            p2Skills: engine.players[1]
              ? {
                  unlockedSkills: engine.players[1].unlockedSkills,
                  skillPoints: engine.players[1].skillPoints,
                  primarySpellId: engine.players[1].primarySpellId,
                  secondarySpellId: engine.players[1].secondarySpellId
                }
              : undefined,
            activePlayerIndex
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
          // ignore
        }
      }
      return success;
    },
    [getTargetPlayer, engine, activePlayerIndex]
  );

  // === IContext Lifecycle implementations ===
  const resetToDefaults = useCallback(() => {
    const p1Defaults = getDefaultSkillsForCharacter("valen");
    if (engine.players[0]) {
      engine.players[0].unlockedSkills = [...p1Defaults.unlockedSkills];
      engine.players[0].skillPoints = p1Defaults.skillPoints;
      engine.players[0].primarySpellId = p1Defaults.primarySpellId;
      engine.players[0].secondarySpellId = p1Defaults.secondarySpellId;
    }

    if (engine.players[1]) {
      const p2Defaults = getDefaultSkillsForCharacter("aurelia");
      engine.players[1].unlockedSkills = [...p2Defaults.unlockedSkills];
      engine.players[1].skillPoints = p2Defaults.skillPoints;
      engine.players[1].primarySpellId = p2Defaults.primarySpellId;
      engine.players[1].secondarySpellId = p2Defaults.secondarySpellId;
    }

    setActivePlayerIndex(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    engine.notifyReact();
    setStateVersion((v) => v + 1);
  }, [engine]);

  const saveToLocalStorage = useCallback(() => {
    try {
      const state: SkillsContextState = {
        p1Skills: {
          unlockedSkills: engine.players[0]?.unlockedSkills || [],
          skillPoints: engine.players[0]?.skillPoints || 0,
          primarySpellId: engine.players[0]?.primarySpellId || "",
          secondarySpellId: engine.players[0]?.secondarySpellId || ""
        },
        p2Skills: engine.players[1]
          ? {
              unlockedSkills: engine.players[1].unlockedSkills,
              skillPoints: engine.players[1].skillPoints,
              primarySpellId: engine.players[1].primarySpellId,
              secondarySpellId: engine.players[1].secondarySpellId
            }
          : undefined,
        activePlayerIndex
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save skills state to localStorage", e);
    }
  }, [engine, activePlayerIndex]);

  const loadFromLocalStorage = useCallback((): boolean => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed: SkillsContextState = JSON.parse(raw);
      if (parsed.p1Skills && engine.players[0]) {
        engine.players[0].unlockedSkills = parsed.p1Skills.unlockedSkills || [];
        engine.players[0].skillPoints = parsed.p1Skills.skillPoints ?? 0;
        if (parsed.p1Skills.primarySpellId) engine.players[0].primarySpellId = parsed.p1Skills.primarySpellId;
        if (parsed.p1Skills.secondarySpellId) engine.players[0].secondarySpellId = parsed.p1Skills.secondarySpellId;
      }
      if (parsed.p2Skills && engine.players[1]) {
        engine.players[1].unlockedSkills = parsed.p2Skills.unlockedSkills || [];
        engine.players[1].skillPoints = parsed.p2Skills.skillPoints ?? 0;
        if (parsed.p2Skills.primarySpellId) engine.players[1].primarySpellId = parsed.p2Skills.primarySpellId;
        if (parsed.p2Skills.secondarySpellId) engine.players[1].secondarySpellId = parsed.p2Skills.secondarySpellId;
      }
      if (typeof parsed.activePlayerIndex === "number") {
        setActivePlayerIndex(parsed.activePlayerIndex);
      }
      engine.notifyReact();
      setStateVersion((v) => v + 1);
      return true;
    } catch (e) {
      console.warn("Failed to load skills state from localStorage", e);
      return false;
    }
  }, [engine]);

  const exportToJson = useCallback((): string => {
    const state: SkillsContextState = {
      p1Skills: {
        unlockedSkills: engine.players[0]?.unlockedSkills || [],
        skillPoints: engine.players[0]?.skillPoints || 0,
        primarySpellId: engine.players[0]?.primarySpellId || "",
        secondarySpellId: engine.players[0]?.secondarySpellId || ""
      },
      p2Skills: engine.players[1]
        ? {
            unlockedSkills: engine.players[1].unlockedSkills,
            skillPoints: engine.players[1].skillPoints,
            primarySpellId: engine.players[1].primarySpellId,
            secondarySpellId: engine.players[1].secondarySpellId
          }
        : undefined,
      activePlayerIndex
    };
    return JSON.stringify(state, null, 2);
  }, [engine, activePlayerIndex]);

  const importFromJson = useCallback(
    (jsonStr: string): boolean => {
      try {
        const parsed: SkillsContextState = JSON.parse(jsonStr);
        if (!parsed.p1Skills) return false;

        if (engine.players[0]) {
          engine.players[0].unlockedSkills = parsed.p1Skills.unlockedSkills || [];
          engine.players[0].skillPoints = parsed.p1Skills.skillPoints ?? 0;
          if (parsed.p1Skills.primarySpellId) engine.players[0].primarySpellId = parsed.p1Skills.primarySpellId;
          if (parsed.p1Skills.secondarySpellId) engine.players[0].secondarySpellId = parsed.p1Skills.secondarySpellId;
        }
        if (parsed.p2Skills && engine.players[1]) {
          engine.players[1].unlockedSkills = parsed.p2Skills.unlockedSkills || [];
          engine.players[1].skillPoints = parsed.p2Skills.skillPoints ?? 0;
          if (parsed.p2Skills.primarySpellId) engine.players[1].primarySpellId = parsed.p2Skills.primarySpellId;
          if (parsed.p2Skills.secondarySpellId) engine.players[1].secondarySpellId = parsed.p2Skills.secondarySpellId;
        }
        if (typeof parsed.activePlayerIndex === "number") {
          setActivePlayerIndex(parsed.activePlayerIndex);
        }
        engine.notifyReact();
        setStateVersion((v) => v + 1);
        return true;
      } catch (e) {
        console.error("Failed to import skills JSON", e);
        return false;
      }
    },
    [engine]
  );

  const value = useMemo<SkillsContextValue>(
    () => ({
      isLoaded,
      resetToDefaults,
      saveToLocalStorage,
      loadFromLocalStorage,
      exportToJson,
      importFromJson,
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
      saveToLocalStorage,
      loadFromLocalStorage,
      exportToJson,
      importFromJson,
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
    throw new Error("useSkills must be used within a SkillsProvider");
  }
  return ctx;
};

export default SkillsContext;
