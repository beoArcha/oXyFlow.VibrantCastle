import React from "react";
import { BookOpen } from "lucide-react";
import { Modal } from "@ui";
import { LanguageSelector } from "@components/common";
import { ModalNavigationTabs, ModalType } from "@components/modal";
import { useI18n } from "@context/I18nContext";
import { useSkills } from "@context/GameContext";
import { useSettings } from "@context/SettingsContext";
import { SkillPlayerTabs } from "./SkillPlayerTabs";
import { SkillTreeConstellation } from "./SkillTreeConstellation";
import { SkillDetailsCard } from "./SkillDetailsCard";

export interface SkillTreePanelProps {
  readonly onClose: () => void;
  readonly onNavigateModal?: (modal: ModalType) => void;
  readonly onResume?: () => void;
}

export const SkillTreePanel = ({
  onClose,
  onNavigateModal,
  onResume,
}: SkillTreePanelProps): React.ReactElement | null => {
  const { t } = useI18n();
  const { activePlayer, activePlayerIndex } = useSkills();
  const { settings } = useSettings();

  if (!activePlayer) return null;

  const quickKeys = activePlayerIndex === 1 ? settings.hud.p2QuickKeys : settings.hud.p1QuickKeys;
  const primarySpellKey = quickKeys?.primarySpell || "U";
  const secondarySpellKey = quickKeys?.secondarySpell || "I";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t("skillTreeTitle")}
      subtitle={t("skillTreeSubtitle")}
      icon={<BookOpen className="w-5 h-5 text-purple-400" />}
      headerRight={<LanguageSelector />}
      maxWidthClass="max-w-4xl"
    >
      <div className="flex flex-col gap-4">
        {onNavigateModal && onResume && (
          <ModalNavigationTabs
            currentModal="skillTree"
            onNavigate={onNavigateModal}
            onResume={onResume}
          />
        )}
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
    </Modal>
  );
};

export default SkillTreePanel;
