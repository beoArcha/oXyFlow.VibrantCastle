import React from "react";
import { Pause, Play, HelpCircle, Menu as MenuIcon, Backpack, BookOpen } from "lucide-react";
import { Dialog, Button, Heading, Paragraph } from "@ui";
import { useI18n } from "@context/I18nContext";
import type { PauseOverlayProps } from "../types";

export const PauseOverlayModal: React.FC<PauseOverlayProps> = React.memo(({
  onResume,
  onOpenHelp,
  onOpenMenu,
  onOpenInventory,
  onOpenSkillTree,
}) => {
  const { t } = useI18n();

  return (
    <Dialog
      isOpen={true}
      onClose={onResume}
      maxWidthClass="max-w-lg"
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={true}
      closeKeys={["Escape", "p", "P"]}
      usePortal={false}
    >
      <div className="flex flex-col items-center text-center p-6 md:p-8 gap-4">
        <div className="w-14 h-14 rounded-full border border-amber-500/50 bg-black/80 flex items-center justify-center text-amber-400 shadow-inner">
          <Pause size={28} />
        </div>
        <div>
          <Heading
            level={2}
            variant="gothic"
            size="2xl"
            dropShadow
            className="md:text-3xl"
          >
            {t("gamePaused")}
          </Heading>
          <Paragraph size="xs" className="text-stone-300 mt-1">
            {t("pressToResume")}
          </Paragraph>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
          <Button
            id="pause-resume-btn"
            variant="primary"
            size="md"
            icon={<Play size={16} />}
            onClick={onResume}
          >
            {t("resume")} [P]
          </Button>
          <Button
            id="pause-help-btn"
            variant="secondary"
            size="md"
            icon={<HelpCircle size={16} />}
            onClick={onOpenHelp}
          >
            {t("hints")} [H]
          </Button>
          <Button
            id="pause-menu-btn"
            variant="outline"
            size="md"
            icon={<MenuIcon size={16} />}
            onClick={onOpenMenu}
          >
            {t("menu")} [M]
          </Button>
          {onOpenInventory && (
            <Button
              id="pause-inventory-btn"
              variant="secondary"
              size="md"
              icon={<Backpack size={16} className="text-amber-400" />}
              onClick={onOpenInventory}
            >
              {t("inventoryBtn")} [I]
            </Button>
          )}
          {onOpenSkillTree && (
            <Button
              id="pause-skills-btn"
              variant="purple"
              size="md"
              icon={<BookOpen size={16} className="text-purple-300" />}
              onClick={onOpenSkillTree}
            >
              {t("skillTreeBtn")} [K]
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
});
