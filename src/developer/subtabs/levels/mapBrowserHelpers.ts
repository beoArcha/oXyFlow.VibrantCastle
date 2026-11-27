import { useMemo } from "react";
import { LocationDefinition } from "@game/locations/types";
import { translations } from "@i18n";
import type { LanguageCode } from "@i18n";
import type { MapCaptionOverlay } from "./mapCanvasRenderer";
import type { MapEntityItem } from "./mapEntities";
import type { ActiveTextFormState } from "./MapTextToolPanel";
import type { DraftPortalTextEntry, DraftTriggerEntry } from "./mapTextPatch";

export function useMapCaptions(params: {
  readonly entities: readonly MapEntityItem[];
  readonly draftTriggers: readonly DraftTriggerEntry[];
  readonly draftPortalsMap: Readonly<Record<string, DraftPortalTextEntry>>;
  readonly language: LanguageCode;
  readonly selectedUid: string | null;
  readonly textForm: ActiveTextFormState | null;
}): readonly MapCaptionOverlay[] {
  const { entities, draftTriggers, draftPortalsMap, language, selectedUid, textForm } = params;

  return useMemo<MapCaptionOverlay[]>(() => {
    const out: MapCaptionOverlay[] = [];
    const dict = translations[language] as unknown as Record<string, string>;

    for (const entity of entities) {
      if (entity.category !== "trigger" && entity.category !== "portal") continue;
      const trigDraft = draftTriggers.find((d) => d.id === entity.id);
      const portalDraft = draftPortalsMap[entity.id];
      const key = entity.textKey ?? "";
      const draftText =
        language === "pl" ? trigDraft?.plText || portalDraft?.plText : trigDraft?.enText || portalDraft?.enText;
      const text = draftText || (key ? dict[key] ?? "" : "");
      if (!text) continue;
      out.push({
        uid: entity.uid,
        key,
        text,
        worldX: entity.x + entity.width / 2,
        worldY: entity.y,
        isActive: entity.uid === selectedUid,
      });
    }

    if (textForm) {
      const activeText = language === "pl" ? textForm.plText || textForm.enText : textForm.enText || textForm.plText;
      if (activeText.trim()) {
        const prefix = textForm.mode === "edit-portal" ? "portal" : "trigger";
        const uid = `${prefix}:${textForm.entityId}`;
        return [
          ...out.filter((c) => c.uid !== uid),
          {
            uid,
            key: textForm.i18nKey || textForm.entityId,
            text: activeText.trim(),
            worldX: textForm.bounds.x + textForm.bounds.width / 2,
            worldY: textForm.bounds.y,
            isActive: true,
          },
        ];
      }
    }
    return out;
  }, [draftPortalsMap, draftTriggers, entities, language, selectedUid, textForm]);
}

export function copyAndNotify(
  text: string,
  onSuccess: () => void,
  onFallback: () => void
): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    onFallback();
    return Promise.resolve();
  }
  return navigator.clipboard.writeText(text).then(onSuccess, onFallback);
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function createEmptyPatch(location: LocationDefinition) {
  return {
    targetFile: `src/data/locations/${location.id}.json`,
    locationId: location.id,
    jsonPatch: [],
    layoutDiff: { addedTriggers: [], updatedTriggers: [], updatedPortals: [] },
    i18n: { pl: {}, en: {} },
  };
}
