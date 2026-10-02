import React, { useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  ConfirmDialog,
} from "@components/ui";
import { useI18n } from "@context/I18nContext";
import { cn } from "@lib/utils";
import { PlayerTabSelector } from "./PlayerTabSelector";
import { ControlsMapperCardProps } from "./types";

export type { ControlsMapperCardProps };

/**
 * Reusable composite card layout for controls mapping panels (Keyboard and Gamepad).
 * Standardizes the header with title and reset button, player tabs selector,
 * scrollable bindings grid, and confirmation dialog for resetting defaults.
 *
 * @example
 * ```tsx
 * <ControlsMapperCard
 *   title="Keyboard Controls"
 *   titleIcon={<Keyboard className="w-5 h-5 text-amber-400" />}
 *   resetBtnId="reset-keyboard-bindings-btn"
 *   onResetDefaults={resetDefaults}
 *   selectedPlayer={selectedPlayer}
 *   onSelectPlayer={setSelectedPlayer}
 *   gridId="keyboard-bindings-grid"
 * >
 *   {rows}
 * </ControlsMapperCard>
 * ```
 */
export const ControlsMapperCard: React.FC<ControlsMapperCardProps> = React.memo(
  function ControlsMapperCard({
    title,
    titleIcon,
    resetBtnId,
    onResetDefaults,
    selectedPlayer,
    onSelectPlayer,
    children,
    beforeGrid,
    gridId,
    gridClassName,
    className,
  }) {
    const { t } = useI18n();
    const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

    const handleConfirmReset = useCallback(() => {
      onResetDefaults();
      setIsConfirmResetOpen(false);
    }, [onResetDefaults]);

    return (
      <Card variant="subtle" className={className ?? "w-full"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle icon={titleIcon}>{title}</CardTitle>
            <Button
              id={resetBtnId}
              variant="ghost"
              size="sm"
              icon={<RotateCcw size={12} />}
              onClick={() => setIsConfirmResetOpen(true)}
            >
              {t("resetDefaultBindings")}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="gap-4">
          <PlayerTabSelector
            selectedPlayer={selectedPlayer}
            onSelectPlayer={onSelectPlayer}
          />

          {beforeGrid}

          <div
            id={gridId}
            className={cn(
              "grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1",
              gridClassName
            )}
          >
            {children}
          </div>
        </CardContent>

        <ConfirmDialog
          isOpen={isConfirmResetOpen}
          onClose={() => setIsConfirmResetOpen(false)}
          onConfirm={handleConfirmReset}
          title={t("confirmResetControls")}
          message={t("confirmResetControlsPrompt")}
          confirmLabel={t("resetDefaultBindings")}
          cancelLabel={t("cancel")}
          confirmVariant="danger"
        />
      </Card>
    );
  }
);

ControlsMapperCard.displayName = "ControlsMapperCard";

export default ControlsMapperCard;
