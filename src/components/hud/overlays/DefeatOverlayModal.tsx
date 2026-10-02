import React from "react";
import { useI18n } from "@context/I18nContext";
import { HUDOutcomeDialog } from "./HUDOutcomeDialog";
import type { DefeatOverlayProps } from "../types";

export const DefeatOverlayModal: React.FC<DefeatOverlayProps> = React.memo(({
  onRestart,
  onOpenMenu,
}) => {
  const { t } = useI18n();

  return (
    <HUDOutcomeDialog
      isOpen={true}
      variant="defeat"
      title={t("defeat")}
      description={t("defeatSubtitle")}
      onRestart={onRestart}
      onOpenMenu={onOpenMenu}
    />
  );
});
