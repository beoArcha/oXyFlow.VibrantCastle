import React from "react";
import { useSkills } from "@context/GameContext";
import { useSettings } from "@context/SettingsContext";
import { SkillPlayerTabs } from "./SkillPlayerTabs";
import { SkillTreeConstellation } from "./SkillTreeConstellation";
import { SkillDetailsCard } from "./SkillDetailsCard";

/**
 * Player-facing skill tree view rendered inside the shared GameMenuDialog body.
 */
export const SkillTreeView = (): React.ReactElement | null => {
  const { activePlayer, activePlayerIndex } = useSkills();
  const { settings } = useSettings();

  if (!activePlayer) return null;

  const quickKeys =
    activePlayerIndex === 1 ? settings.hud.p2QuickKeys : settings.hud.p1QuickKeys;
  const primarySpellKey = quickKeys?.primarySpell || "U";
  const secondarySpellKey = quickKeys?.secondarySpell || "I";

  return (
    <div className="flex flex-col gap-4">
      <SkillPlayerTabs />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 flex flex-col">
          <SkillTreeConstellation
            primaryKey={primarySpellKey}
            secondaryKey={secondarySpellKey}
          />
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <SkillDetailsCard
            primaryKey={primarySpellKey}
            secondaryKey={secondarySpellKey}
          />
        </div>
      </div>
    </div>
  );
};

SkillTreeView.displayName = "SkillTreeView";
export default SkillTreeView;
