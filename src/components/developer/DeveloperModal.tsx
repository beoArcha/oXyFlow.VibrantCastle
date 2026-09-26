import React from "react";
import { Code2 } from "lucide-react";
import { Modal, ModalNavigationTabs, ModalType, LanguageSelector } from "../ui";
import { DeveloperTab } from "./DeveloperTab";
import { useI18n } from "../../hooks/useI18n";

export interface DeveloperModalProps {
  onClose: () => void;
  onNavigateModal?: (modal: ModalType) => void;
  onResume?: () => void;
}

/**
 * Top-level Developer Modal (on the same level as MenuModal, HelpModal, InventoryPanel, SkillTreePanel).
 */
export const DeveloperModal: React.FC<DeveloperModalProps> = ({
  onClose,
  onNavigateModal,
  onResume,
}) => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t("tabDeveloper")}
      subtitle={t("devSuiteSubtitle")}
      icon={<Code2 className="w-5 h-5 text-amber-400" />}
      headerRight={<LanguageSelector />}
      maxWidthClass="max-w-5xl"
      allowMaximize={true}
      defaultMaximized={true}
    >
      <div className="flex flex-col gap-4">
        {onNavigateModal && onResume && (
          <ModalNavigationTabs
            currentModal="creation"
            onNavigate={onNavigateModal}
            onResume={onResume}
          />
        )}
        <DeveloperTab />
      </div>
    </Modal>
  );
};

export default DeveloperModal;
