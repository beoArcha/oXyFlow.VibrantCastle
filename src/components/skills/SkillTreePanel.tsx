import React from "react";
import { BookOpen } from "lucide-react";
import { Modal, LanguageSelector } from "../ui";
import { ModalNavigationTabs, ModalType } from "@components/modal";
import { useI18n } from "@context/I18nContext";
import { useSkills } from "@context/GameContext";
import { SkillPlayerTabs } from "./SkillPlayerTabs";
import { SkillTreeConstellation } from "./SkillTreeConstellation";
import { SkillDetailsCard } from "./SkillDetailsCard";

export interface SkillTreePanelProps {
  onClose: () => void;
  onNavigateModal?: (modal: ModalType) => void;
  onResume?: () => void;
}

export const SkillTreePanel: React.FC<SkillTreePanelProps> = ({
  onClose,
  onNavigateModal,
  onResume,
}) => {
  const { t } = useI18n();
  const { activePlayer } = useSkills();

  if (!activePlayer) return null;

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
        {/* Top Header: Character Selection Tabs & PU */}
        <SkillPlayerTabs />

        {/* Constellation & Details Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Constellation Tree (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <SkillTreeConstellation />
          </div>

          {/* Right: Skill Detail & Restrictions Inspector (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <SkillDetailsCard />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SkillTreePanel;
