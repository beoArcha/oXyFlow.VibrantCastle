import React from "react";
import { ArrowRight, RotateCcw, Menu as MenuIcon, Trophy, Skull } from "lucide-react";
import { Dialog, Button, Heading, Paragraph } from "@ui";
import { useI18n } from "@context/I18nContext";

export interface HUDOutcomeDialogProps {
  readonly isOpen: boolean;
  readonly variant: "victory" | "defeat";
  readonly title: string;
  readonly description: string;
  readonly onRestart: () => void;
  readonly onOpenMenu: () => void;
  readonly onNextLocation?: () => void;
  readonly usePortal?: boolean;
}

export const HUDOutcomeDialog: React.FC<HUDOutcomeDialogProps> = React.memo(({
  isOpen,
  variant,
  title,
  description,
  onRestart,
  onOpenMenu,
  onNextLocation,
  usePortal = false,
}) => {
  const { t } = useI18n();
  const isVictory = variant === "victory";

  const icon = isVictory ? (
    <Trophy className="w-7 h-7 text-amber-400" />
  ) : (
    <Skull className="w-7 h-7 text-red-500" />
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onOpenMenu}
      maxWidthClass="max-w-md"
      contentClassName={isVictory ? "border-amber-500/60" : "border-red-600/70 bg-[#1c0808]/95"}
      showCloseButton={false}
      closeOnBackdropClick={false}
      closeOnEscape={false}
      usePortal={usePortal}
    >
      <div className="flex flex-col items-center text-center p-6 md:p-8 gap-3">
        <div className="w-14 h-14 rounded-full border border-stone-700/60 bg-black/60 flex items-center justify-center shadow-inner">
          {icon}
        </div>
        <Heading
          level={2}
          variant={isVictory ? "gothic" : "danger"}
          size="3xl"
          dropShadow
          className="md:text-4xl tracking-wider"
        >
          {title}
        </Heading>
        <Paragraph size="sm" className="md:text-base text-stone-300 max-w-sm">
          {description}
        </Paragraph>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          {isVictory && onNextLocation && (
            <Button
              id="advance-location-btn"
              size="lg"
              variant="primary"
              icon={<ArrowRight size={18} />}
              onClick={onNextLocation}
            >
              {t("nextLocation")}
            </Button>
          )}
          <Button
            id={isVictory ? "victory-restart-btn" : "defeat-restart-btn"}
            size="lg"
            variant={isVictory ? "secondary" : "danger"}
            icon={<RotateCcw size={18} />}
            onClick={onRestart}
          >
            {t("restart")}
          </Button>
          <Button
            id={isVictory ? "victory-menu-btn" : "defeat-menu-btn"}
            size="lg"
            variant="outline"
            icon={<MenuIcon size={18} />}
            onClick={onOpenMenu}
          >
            {t("menu")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
});
