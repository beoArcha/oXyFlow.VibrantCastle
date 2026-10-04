import React, { useState } from "react";
import { HelpCircle, Swords, Gamepad2 } from "lucide-react";
import { PlayerId } from "@game/types";
import { Modal, Button } from "@ui";
import { LanguageSelector } from "@components/adapters";
import { ModalNavigationTabs } from "@components/modal";
import { useI18n } from "@context/I18nContext";
import { HelpBanner } from "./HelpBanner";
import { HelpNavigation } from "./HelpNavigation";
import { HelpShortcutsGrid } from "./HelpShortcutsGrid";
import { HelpControlsCard } from "./HelpControlsCard";
import { HelpMechanicsTips } from "./HelpMechanicsTips";
import { HelpTab, HelpModalProps } from "./types";

export type { HelpModalProps };

/**
 * HelpModal Orchestrator.
 * Displays universal shortcuts, combat/movement controls, and gameplay mechanics.
 */
export const HelpModal: React.FC<HelpModalProps> = React.memo(
  function HelpModal({
    onClose,
    defaultTab = "all",
    onNavigateModal,
    onResume,
  }) {
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
        <div
          className="flex flex-col gap-5 text-stone-200 text-sm select-none"
          role="region"
          aria-label="Help and Guide Content"
        >
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

          {showControls && (
            <section className="flex flex-col gap-2.5" aria-labelledby="controls-heading">
              <div
                id="controls-heading"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400"
              >
                <Swords size={14} />
                <span>{t("combatAndMovement")}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <HelpControlsCard
                  playerId={PlayerId.Player1}
                  title={t("p1Status")}
                  icon={<Swords size={14} />}
                  flankBadge={t("p1FlankLabel")}
                  theme="crimson"
                />
                <HelpControlsCard
                  playerId={PlayerId.Player2}
                  title={t("p2Status")}
                  icon={<Gamepad2 size={14} />}
                  flankBadge={t("p2FlankLabel")}
                  theme="cyan"
                />
              </div>
            </section>
          )}

          {showMechanics && <HelpMechanicsTips />}

          <footer className="flex justify-end pt-2">
            <Button variant="primary" size="md" onClick={onClose}>
              {t("returnToGame")}
            </Button>
          </footer>
        </div>
      </Modal>
    );
  }
);

HelpModal.displayName = "HelpModal";

export default HelpModal;
