import React from "react";
import { Download, Copy, RotateCcw, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button, Badge, Textarea, Alert } from "@ui";

export interface AtlasJsonExportPanelProps {
  readonly jsonDraft: string;
  readonly jsonError: string | null;
  readonly onJsonDraftChange: (value: string) => void;
  readonly onCopyJson: () => void;
  readonly onDownloadJson: () => void;
  readonly onResetPreset: () => void;
}

/**
 * Live meta.json editor, syntax validator, and export/reset toolbar tab.
 */
export const AtlasJsonExportPanel: React.FC<AtlasJsonExportPanelProps> = ({
  jsonDraft,
  jsonError,
  onJsonDraftChange,
  onCopyJson,
  onDownloadJson,
  onResetPreset,
}) => (
  <>
    <div className="flex flex-wrap items-center justify-between gap-2">
      {jsonError ? (
        <Badge variant="red" icon={<AlertTriangle size={12} />}>
          Błąd składni JSON
        </Badge>
      ) : (
        <Badge variant="green" icon={<CheckCircle2 size={12} />}>
          Poprawny meta.json
        </Badge>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          icon={<Copy size={12} />}
          className="whitespace-nowrap shrink-0 px-2.5"
          onClick={onCopyJson}
        >
          Kopiuj
        </Button>
        <Button
          size="sm"
          variant="primary"
          icon={<Download size={12} />}
          className="whitespace-nowrap shrink-0 px-2.5"
          onClick={onDownloadJson}
        >
          Pobierz JSON
        </Button>
        <Button
          size="sm"
          variant="outline"
          icon={<RotateCcw size={12} />}
          className="whitespace-nowrap shrink-0 px-2.5"
          onClick={onResetPreset}
        >
          Resetuj
        </Button>
      </div>
    </div>

    <Textarea
      value={jsonDraft}
      rows={14}
      className="font-mono text-[11px]"
      onChange={(e) => onJsonDraftChange(e.target.value)}
    />
    {jsonError && <Alert variant="danger" title={jsonError} />}
  </>
);
