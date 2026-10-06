import React, { useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@ui";
import { useI18n } from "@context/I18nContext";
import { JsonExportModal } from "./JsonExportModal";

export interface ExportToolbarProps {
  readonly data: unknown;
  readonly filename: string;
  readonly modalTitle?: string;
  readonly isValid?: boolean;
  readonly className?: string;
  readonly buttonLabel?: string;
}

/**
 * Compact toolbar providing a one-click trigger to open the JSON Export Modal.
 */
export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  data,
  filename,
  modalTitle,
  isValid = true,
  className = "",
  buttonLabel,
}) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="secondary"
          size="sm"
          icon={<FileDown size={14} className="text-amber-400" />}
          onClick={() => setIsOpen(true)}
          title={!isValid ? t("dataStudioExportWarning") : undefined}
        >
          {buttonLabel ?? t("dataStudioExportButton")}
        </Button>
      </div>

      <JsonExportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        data={data}
        filename={filename}
        title={modalTitle}
      />
    </>
  );
};
