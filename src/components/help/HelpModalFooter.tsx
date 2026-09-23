import React from "react";
import { Button } from "../ui";
import { useI18n } from "../../hooks/useI18n";

export interface HelpModalFooterProps {
  onClose: () => void;
  className?: string;
}

/**
 * Footer action bar for the HelpModal.
 */
export const HelpModalFooter: React.FC<HelpModalFooterProps> = ({
  onClose,
  className = "",
}) => {
  const { t } = useI18n();

  return (
    <footer className={`flex justify-end pt-2 ${className}`}>
      <Button variant="primary" size="md" onClick={onClose}>
        {t("returnToGame")}
      </Button>
    </footer>
  );
};

export default HelpModalFooter;
