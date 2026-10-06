import React, { useState } from "react";
import { Wand2, Skull, Shield, MessageSquare, GitFork, Bot } from "lucide-react";
import { Button } from "@ui";
import { useI18n } from "@context/I18nContext";
import { SpellAndSkillEditorCard } from "./datastudio/SpellAndSkillEditorCard";
import { EnemyEditorCard } from "./datastudio/EnemyEditorCard";
import { ItemEditorCard } from "./datastudio/ItemEditorCard";
import { VisualNovelPreviewCard } from "./datastudio/VisualNovelPreviewCard";
import { SkillTreeVisualizerCard } from "./datastudio/SkillTreeVisualizerCard";
import { AIGeneratorCard } from "./datastudio/AIGeneratorCard";

export type DataStudioSection =
  | "spells"
  | "enemies"
  | "items"
  | "vn"
  | "skill_tree"
  | "ai";

export const DataStudioSubTab: React.FC = () => {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState<DataStudioSection>("spells");

  return (
    <div
      data-testid="data-studio-content"
      className="data-studio-content flex flex-col gap-4 p-3 md:p-4 max-w-7xl mx-auto w-full"
    >
      {/* Header & Section Navigation Bar */}
      <div className="flex flex-col gap-2 pb-2 border-b border-amber-900/50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base md:text-lg font-serif font-black text-amber-400">
              {t("dataStudioTitle")}
            </h2>
            <p className="text-xs text-amber-200/70">{t("dataStudioSubtitle")}</p>
          </div>
        </div>

        {/* Section Navigation Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <Button
            data-testid="data-studio-nav-spells"
            variant={activeSection === "spells" ? "primary" : "secondary"}
            size="sm"
            icon={<Wand2 size={13} />}
            onClick={() => setActiveSection("spells")}
          >
            {t("dataStudioSpellsTab")}
          </Button>
          <Button
            data-testid="data-studio-nav-enemies"
            variant={activeSection === "enemies" ? "primary" : "secondary"}
            size="sm"
            icon={<Skull size={13} />}
            onClick={() => setActiveSection("enemies")}
          >
            {t("dataStudioEnemiesTab")}
          </Button>
          <Button
            data-testid="data-studio-nav-items"
            variant={activeSection === "items" ? "primary" : "secondary"}
            size="sm"
            icon={<Shield size={13} />}
            onClick={() => setActiveSection("items")}
          >
            {t("dataStudioItemsTab")}
          </Button>
          <Button
            data-testid="data-studio-nav-vn"
            variant={activeSection === "vn" ? "primary" : "secondary"}
            size="sm"
            icon={<MessageSquare size={13} />}
            onClick={() => setActiveSection("vn")}
          >
            {t("dataStudioVnTab")}
          </Button>
          <Button
            data-testid="data-studio-nav-skill_tree"
            variant={activeSection === "skill_tree" ? "primary" : "secondary"}
            size="sm"
            icon={<GitFork size={13} />}
            onClick={() => setActiveSection("skill_tree")}
          >
            {t("dataStudioSkillTreeTab")}
          </Button>
          <Button
            data-testid="data-studio-nav-ai"
            variant={activeSection === "ai" ? "primary" : "secondary"}
            size="sm"
            icon={<Bot size={13} />}
            onClick={() => setActiveSection("ai")}
          >
            {t("dataStudioAiTab")}
          </Button>
        </div>
      </div>

      {/* Active Section Content */}
      <div className="flex flex-col gap-4">
        {activeSection === "spells" && <SpellAndSkillEditorCard />}
        {activeSection === "enemies" && <EnemyEditorCard />}
        {activeSection === "items" && <ItemEditorCard />}
        {activeSection === "vn" && <VisualNovelPreviewCard />}
        {activeSection === "skill_tree" && <SkillTreeVisualizerCard />}
        {activeSection === "ai" && <AIGeneratorCard />}
      </div>
    </div>
  );
};

export default DataStudioSubTab;
