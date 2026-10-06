import React, { useMemo } from "react";
import { Download, FileJson, X } from "lucide-react";
import { Modal, Button, CopyableSnippet } from "@ui";
import { useI18n } from "@context/I18nContext";

export interface JsonExportModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly data: unknown;
  readonly filename?: string;
  readonly title?: string;
  readonly usePortal?: boolean;
}

/**
 * Universal JSON Export Modal for DataStudio editors.
 * Allows inspecting formatted JSON payload, copying to clipboard, and downloading as a .json file.
 */
export const JsonExportModal: React.FC<JsonExportModalProps> = ({
  isOpen,
  onClose,
  data,
  filename = "data_export.json",
  title,
  usePortal,
}) => {
  const { t } = useI18n();

  const formattedJson = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return "{}";
    }
  }, [data]);

  const byteLength = useMemo(() => {
    return new Blob([formattedJson]).size;
  }, [formattedJson]);

  const handleDownload = () => {
    try {
      if (typeof window === "undefined" || !window.URL) return;
      const blob = new Blob([formattedJson], { type: "application/json;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Failed to trigger file download:", err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      usePortal={usePortal}
      title={title ?? t("dataStudioExportModalTitle")}
      subtitle={`${filename} • ${(byteLength / 1024).toFixed(1)} KB`}
      icon={<FileJson size={18} className="text-amber-400" />}
      maxWidthClass="max-w-3xl"
    >
      <div className="flex flex-col gap-3 py-1">
        <CopyableSnippet
          text={formattedJson}
          title={filename}
          icon={<FileJson size={14} className="text-amber-400" />}
          copyLabel={t("dataStudioAiCopyPrompt")}
          copiedLabel={t("dataStudioAiCopied")}
          maxHeightClass="max-h-80"
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-900/40">
          <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={14} />}>
            {t("dataStudioExportClose")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleDownload}
          >
            {t("dataStudioExportDownloadButton")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
