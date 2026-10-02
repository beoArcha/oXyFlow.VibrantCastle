import React from "react";
import { useI18n } from "@context/I18nContext";
import { HUDOutcomeDialog } from "./HUDOutcomeDialog";
import type { VictoryOverlayProps } from "../types";

export const VictoryOverlayModal: React.FC<VictoryOverlayProps> = React.memo(({
  onNextLocation,
  onRestart,
  onOpenMenu,
}) => {
  const { t } = useI18n();

  return (
    <HUDOutcomeDialog
      isOpen={true}
      variant="victory"
      title={t("victory")}
      description={t("trainingGoalSuccess")}
      onNextLocation={onNextLocation}
      onRestart={onRestart}
      onOpenMenu={onOpenMenu}
    />
  );
});
