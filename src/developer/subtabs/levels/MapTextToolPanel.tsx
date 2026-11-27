import React from "react";
import {
  Check,
  Copy,
  Download,
  FileJson,
  MessageSquarePlus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CopyableSnippet,
  Input,
  Switch,
  Text,
  Textarea,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import type { Rect2D } from "./mapViewport";
import type { LocationTextPatchPayload } from "./mapTextPatch";

export interface ActiveTextFormState {
  readonly mode: "create-trigger" | "edit-trigger" | "edit-portal";
  readonly entityId: string;
  readonly bounds: Rect2D;
  readonly beat: string;
  readonly i18nKey: string;
  readonly plText: string;
  readonly enText: string;
  readonly oneShot: boolean;
  readonly portalIndex?: number;
  readonly portalKey?: string;
  readonly triggerIndex?: number;
}

export interface MapTextToolPanelProps {
  readonly form: ActiveTextFormState | null;
  readonly draftsCount: number;
  readonly patchPayload: LocationTextPatchPayload;
  readonly patchJson: string;
  readonly showPatchPreview: boolean;
  readonly patchCopied: boolean;
  readonly onFormChange: (next: ActiveTextFormState) => void;
  readonly onSuggestKey: () => void;
  readonly onApplyDraft: () => void;
  readonly onClearDrafts: () => void;
  readonly onExportPatch: () => void;
  readonly onCopyPatch: () => void;
  readonly onDownloadPatch: () => void;
}

export const MapTextToolPanel: React.FC<MapTextToolPanelProps> = ({
  form,
  draftsCount,
  patchPayload,
  patchJson,
  showPatchPreview,
  patchCopied,
  onFormChange,
  onSuggestKey,
  onApplyDraft,
  onClearDrafts,
  onExportPatch,
  onCopyPatch,
  onDownloadPatch,
}) => {
  const { t } = useI18n();
  const hasChanges =
    patchPayload.jsonPatch.length > 0 ||
    Object.keys(patchPayload.i18n.pl).length > 0 ||
    Object.keys(patchPayload.i18n.en).length > 0;

  return (
    <Card variant="subtle" className="xl:col-span-4 flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle icon={<MessageSquarePlus className="w-4 h-4 text-purple-400" />}>
            {t("levelsMapTextToolTitle")}
          </CardTitle>
          <Badge variant={draftsCount > 0 ? "purple" : "stone"}>
            {t("levelsMapTextDraftsCount", { count: draftsCount })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Text size="xs" variant="muted">
          {t("levelsMapTextToolHint")}
        </Text>

        {!form ? (
          <div className="rounded-lg border border-stone-800 bg-black/40 p-3">
            <Text size="xs" variant="muted">
              {t("levelsMapTextNoSelection")}
            </Text>
          </div>
        ) : (
          <div className="rounded-lg border border-stone-800 bg-black/40 p-3 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <Badge variant={form.mode === "create-trigger" ? "purple" : "cyan"}>
                {form.mode === "create-trigger"
                  ? t("levelsMapTextTargetNew")
                  : t("levelsMapTextTargetEdit", { id: form.entityId })}
              </Badge>
              <Text size="xs" variant="muted" className="font-mono">
                {t("levelsMapTextBoundsLabel", {
                  x: form.bounds.x,
                  y: form.bounds.y,
                  w: form.bounds.width,
                  h: form.bounds.height,
                })}
              </Text>
            </div>

            <div className="flex items-end gap-2">
              <Input
                label={t("levelsMapTextBeatLabel")}
                value={form.beat}
                onChange={(e) => onFormChange({ ...form, beat: e.target.value })}
                containerClassName="flex-1"
              />
              <Button
                size="sm"
                variant="secondary"
                icon={<Sparkles size={12} />}
                onClick={onSuggestKey}
                className="shrink-0"
              >
                {t("levelsMapTextSuggestKey")}
              </Button>
            </div>

            <Input
              label={t("levelsMapTextKeyLabel")}
              family="mono"
              value={form.i18nKey}
              onChange={(e) => onFormChange({ ...form, i18nKey: e.target.value })}
            />

            <Textarea
              label={t("levelsMapTextPlLabel")}
              rows={2}
              value={form.plText}
              placeholder={t("levelsMapTextPlPlaceholder")}
              onChange={(e) => onFormChange({ ...form, plText: e.target.value })}
            />

            <Textarea
              label={t("levelsMapTextEnLabel")}
              rows={2}
              value={form.enText}
              placeholder={t("levelsMapTextEnPlaceholder")}
              onChange={(e) => onFormChange({ ...form, enText: e.target.value })}
            />

            {form.mode !== "edit-portal" && (
              <Switch
                label={t("levelsMapTextOneShot")}
                checked={form.oneShot}
                onCheckedChange={(checked) => onFormChange({ ...form, oneShot: checked })}
              />
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                size="sm"
                variant="primary"
                onClick={onApplyDraft}
                disabled={!form.i18nKey.trim()}
              >
                {t("levelsMapTextApplyDraft")}
              </Button>
              {draftsCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  icon={<RotateCcw size={12} />}
                  onClick={onClearDrafts}
                >
                  {t("levelsMapTextResetDraft")}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-800/80">
          <Button
            size="sm"
            variant="primary"
            icon={<FileJson size={13} />}
            onClick={onExportPatch}
          >
            {t("levelsMapExportPatch")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={patchCopied ? <Check size={13} /> : <Copy size={13} />}
            onClick={onCopyPatch}
            disabled={!hasChanges}
          >
            {patchCopied ? t("levelsMapInspectorCopied") : t("levelsMapCopyPatch")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={<Download size={13} />}
            onClick={onDownloadPatch}
            disabled={!hasChanges}
          >
            {t("levelsMapDownloadPatch")}
          </Button>
        </div>

        {patchCopied && <Alert variant="success" title={t("levelsMapPatchCopied")} />}

        {showPatchPreview &&
          (hasChanges ? (
            <CopyableSnippet
              text={patchJson}
              title={t("levelsMapPatchPreviewTitle", { file: patchPayload.targetFile })}
              copyLabel={t("levelsMapCopyPatch")}
              copiedLabel={t("levelsMapInspectorCopied")}
              maxHeightClass="max-h-60"
            />
          ) : (
            <Text size="xs" variant="muted">
              {t("levelsMapPatchNoChanges")}
            </Text>
          ))}
      </CardContent>
    </Card>
  );
};

MapTextToolPanel.displayName = "MapTextToolPanel";
export default MapTextToolPanel;
