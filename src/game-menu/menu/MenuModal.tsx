import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Modal } from "@ui";
import { LanguageSelector } from "@game-menu/common";
import { ModalNavigationTabs, ModalType } from "@game-menu/modal";
import { MenuPanel, MenuPanelProps } from "./MenuPanel";
import { useI18n } from "@context/I18nContext";

export interface MenuModalProps extends MenuPanelProps {
  readonly onClose: () => void;
  readonly onNavigateModal?: (modal: ModalType) => void;
  readonly onResume?: () => void;
}

export const MenuModal = ({
  onClose,
  onStartRebind,
  initialTab,
  onNavigateModal,
  onResume,
}: MenuModalProps): React.ReactElement => {
  const { t } = useI18n();

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`${t("menu")} & ${t("settings")}`}
      subtitle={t("menuSubtitle")}
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
        <MenuPanel onStartRebind={onStartRebind} initialTab={initialTab} />
      </div>
    </Modal>
  );
};

export default MenuModal;
