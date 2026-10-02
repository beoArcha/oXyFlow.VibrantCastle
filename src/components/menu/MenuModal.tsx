import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Modal } from "@components/ui";
import { LanguageSelector } from "@components/adapters";
import { ModalNavigationTabs, ModalType } from "@components/modal";
import { MenuPanel, MenuPanelProps } from "./MenuPanel";
import { useI18n } from "@context/I18nContext";

export interface MenuModalProps extends MenuPanelProps {
  onClose: () => void;
  onNavigateModal?: (modal: ModalType) => void;
  onResume?: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({
  onClose,
  onStartRebind,
  onNavigateModal,
  onResume,
}) => {
  const { t, language } = useI18n();

  const subtitle =
    language === "pl"
      ? "Konfiguracja parametrów rozgrywki, sterowania, dźwięku i grafiki"
      : "Gameplay settings, controls configuration, audio and graphics options";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${t("menu")} & ${t("settings")}`}
      subtitle={subtitle}
      icon={<SlidersHorizontal className="w-5 h-5 text-amber-400" />}
      headerRight={<LanguageSelector />}
      maxWidthClass="max-w-4xl"
      closeKeys={["Escape", "p", "P"]}
    >
      <div className="flex flex-col gap-4">
        {onNavigateModal && onResume && (
          <ModalNavigationTabs
            currentModal="menu"
            onNavigate={onNavigateModal}
            onResume={onResume}
          />
        )}
        <MenuPanel onStartRebind={onStartRebind} />
      </div>
    </Modal>
  );
};
