import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Modal, LanguageSelector } from "../ui";
import { ModalNavigationTabs, ModalType } from "@components/modal";
import { useI18n } from "@context/I18nContext";
import { HelpModalLayout } from "./HelpModalLayout";
import { HelpBanner } from "./HelpBanner";
import { HelpNavigation } from "./HelpNavigation";
import { HelpShortcutsGrid } from "./HelpShortcutsGrid";
import { HelpControlsSection } from "./HelpControlsSection";
import { HelpMechanicsTips } from "./HelpMechanicsTips";
import { HelpModalFooter } from "./HelpModalFooter";
import { HelpTab } from "./types";

export interface HelpModalProps {
  onClose: () => void;
  defaultTab?: HelpTab;
  onNavigateModal?: (modal: ModalType) => void;
  onResume?: () => void;
}

/**
 * HelpModal Orchestrator.
 *
 * Responsibilities:
 * - Harmonious size (max-w-4xl) consistent with Menu and other modals.
 * - Pinned navigation and clean scrollable content.
 * - Delegates all translations to centralized i18n hooks.
 */
export const HelpModal: React.FC<HelpModalProps> = ({
  onClose,
  defaultTab = "all",
  onNavigateModal,
  onResume,
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<HelpTab>(defaultTab);

  const showShortcuts = activeTab === "all" || activeTab === "shortcuts";
  const showControls = activeTab === "all" || activeTab === "controls";
  const showMechanics = activeTab === "all" || activeTab === "mechanics";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t("helpModalTitle")}
      subtitle={t("helpGuideSubtitle")}
      icon={<HelpCircle className="w-5 h-5 text-amber-400" />}
      headerRight={<LanguageSelector />}
      maxWidthClass="max-w-4xl"
    >
      <HelpModalLayout>
        {onNavigateModal && onResume && (
          <ModalNavigationTabs
            currentModal="help"
            onNavigate={onNavigateModal}
            onResume={onResume}
          />
        )}
        <HelpNavigation activeTab={activeTab} onSelectTab={setActiveTab} />
        <HelpBanner />
        {showShortcuts && <HelpShortcutsGrid />}
        {showControls && <HelpControlsSection />}
        {showMechanics && <HelpMechanicsTips />}
        <HelpModalFooter onClose={onClose} />
      </HelpModalLayout>
    </Modal>
  );
};

export default HelpModal;
