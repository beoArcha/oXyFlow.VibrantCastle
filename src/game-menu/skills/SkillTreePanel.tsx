import React from "react";
import { BookOpen } from "lucide-react";
import { Modal } from "@ui";
import { LanguageSelector } from "@game-menu/common";
import {
  ModalNavigationTabs,
  ResumeButton,
  ModalType,
  GAME_MODAL_WIDTH_CLASS,
} from "@game-menu/modal";
import { useI18n } from "@context/I18nContext";
import { useSkills } from "@context/GameContext";
import { SkillTreeView } from "./SkillTreeView";

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
  const { activePlayer } = useSkills();

  if (!activePlayer) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t("skillTreeTitle")}
      subtitle={t("skillTreeSubtitle")}
      icon={<BookOpen className="w-5 h-5 text-purple-400" />}
      headerRight={onResume ? <ResumeButton onResume={onResume} /> : <LanguageSelector />}
      maxWidthClass={GAME_MODAL_WIDTH_CLASS}
    >
      <div className="flex flex-col gap-4">
        {onNavigateModal && (
          <ModalNavigationTabs
            currentModal="skillTree"
            onNavigate={onNavigateModal}
            showCreation={false}
          />
        )}
        <SkillTreeView />
      </div>
    </Modal>
  );
};

export default SkillTreePanel;
