import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@context/I18nContext";
import { ALL_LOCATIONS, LocationId } from "@game/locations";
import { translations } from "@i18n";
import type { MapToolMode } from "./MapBrowserCanvas";
import type { ActiveTextFormState } from "./MapTextToolPanel";
import { extractMapEntities, type MapEntityCategory, type MapEntityItem } from "./mapEntities";
import {
  copyAndNotify,
  createEmptyPatch,
  downloadTextFile,
  useMapCaptions,
} from "./mapBrowserHelpers";
import {
  buildLocationTextPatch,
  formatPatchJson,
  suggestNarrationKey,
  suggestTriggerId,
  type DraftPortalTextEntry,
  type DraftTriggerEntry,
} from "./mapTextPatch";
import {
  fitViewportToMap,
  zoomAroundPoint,
  type Point2D,
  type Rect2D,
  type ViewportTransform,
} from "./mapViewport";

export const MAP_CANVAS_SIZE = { width: 960, height: 520 } as const;

export const ALL_MAP_CATEGORIES: readonly MapEntityCategory[] = [
  "solid",
  "gate",
  "lever",
  "portal",
  "trigger",
  "spawn",
  "enemy",
  "hazard",
];

export function useMapBrowserState(selectedLocationId: LocationId) {
  const { language } = useI18n();
  const activeLocation = useMemo(
    () => ALL_LOCATIONS.find((loc) => loc.id === selectedLocationId) ?? ALL_LOCATIONS[0],
    [selectedLocationId]
  );

  const [toolMode, setToolMode] = useState<MapToolMode>("inspect");
  const [viewport, setViewport] = useState<ViewportTransform>(() =>
    fitViewportToMap(activeLocation.width, activeLocation.height, MAP_CANVAS_SIZE.width, MAP_CANVAS_SIZE.height)
  );
  const [visibleCategories, setVisibleCategories] = useState<Set<MapEntityCategory>>(
    () => new Set(ALL_MAP_CATEGORIES)
  );
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [cursorWorld, setCursorWorld] = useState<Point2D | null>(null);
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [draftTriggersByLoc, setDraftTriggersByLoc] = useState<Record<string, DraftTriggerEntry[]>>({});
  const [draftPortalsByLoc, setDraftPortalsByLoc] = useState<
    Record<string, Record<string, DraftPortalTextEntry>>
  >({});
  const [textForm, setTextForm] = useState<ActiveTextFormState | null>(null);
  const [showPatchPreview, setShowPatchPreview] = useState<boolean>(false);
  const [patchCopied, setPatchCopied] = useState<boolean>(false);

  const draftTriggers = draftTriggersByLoc[activeLocation.id] ?? [];
  const draftPortalsMap = draftPortalsByLoc[activeLocation.id] ?? {};

  useEffect(() => {
    setViewport(
      fitViewportToMap(activeLocation.width, activeLocation.height, MAP_CANVAS_SIZE.width, MAP_CANVAS_SIZE.height)
    );
    setSelectedUid(null);
    setTextForm(null);
    setShowPatchPreview(false);
  }, [activeLocation.id, activeLocation.width, activeLocation.height]);

  const { entities, leverGateLinks } = useMemo(
    () => extractMapEntities(activeLocation, draftTriggers, draftPortalsMap),
    [activeLocation, draftTriggers, draftPortalsMap]
  );

  const selectedEntity = useMemo(
    () => entities.find((e) => e.uid === selectedUid) ?? null,
    [entities, selectedUid]
  );

  const existingKeys = useMemo(() => {
    const keys = new Set<string>(Object.keys(translations.en));
    for (const trig of activeLocation.jsonBlueprint?.layout.triggers ?? []) keys.add(trig.triggerId);
    for (const draft of draftTriggers) keys.add(draft.triggerId);
    return keys;
  }, [activeLocation, draftTriggers]);

  const openTextEditorForEntity = useCallback(
    (entity: MapEntityItem) => {
      setSelectedUid(entity.uid);
      setToolMode("text");
      const key = entity.textKey || suggestNarrationKey(activeLocation.id, entity.id, existingKeys);
      const draftTrig = draftTriggers.find((d) => d.id === entity.id);
      const draftPortal = draftPortalsMap[entity.id];
      const plDict = translations.pl as unknown as Record<string, string>;
      const enDict = translations.en as unknown as Record<string, string>;

      setTextForm({
        mode: entity.category === "portal" ? "edit-portal" : "edit-trigger",
        entityId: entity.id,
        bounds: { x: entity.x, y: entity.y, width: entity.width, height: entity.height },
        beat: entity.id,
        i18nKey: key,
        plText: draftTrig?.plText ?? draftPortal?.plText ?? plDict[key] ?? "",
        enText: draftTrig?.enText ?? draftPortal?.enText ?? enDict[key] ?? "",
        oneShot: Boolean(entity.oneShot),
        triggerIndex: entity.sourceIndex,
        portalIndex: entity.sourceIndex,
        portalKey: entity.portalKey,
      });
    },
    [activeLocation.id, draftPortalsMap, draftTriggers, existingKeys]
  );

  const handleSelectEntity = useCallback(
    (entity: MapEntityItem | null) => {
      if (!entity) {
        setSelectedUid(null);
        return;
      }
      if (toolMode === "text") {
        openTextEditorForEntity(entity);
        return;
      }
      setSelectedUid(entity.uid);
    },
    [openTextEditorForEntity, toolMode]
  );

  const handleCreateTriggerArea = useCallback(
    (rect: Rect2D) => {
      const existingIds = new Set(entities.map((e) => e.id));
      const newId = suggestTriggerId("narr", existingIds);
      const suggestedKey = suggestNarrationKey(activeLocation.id, "beat", existingKeys);
      setSelectedUid(null);
      setTextForm({
        mode: "create-trigger",
        entityId: newId,
        bounds: rect,
        beat: "beat",
        i18nKey: suggestedKey,
        plText: "",
        enText: "",
        oneShot: true,
      });
    },
    [activeLocation.id, entities, existingKeys]
  );

  const handleApplyDraft = useCallback(() => {
    if (!textForm || !textForm.i18nKey.trim()) return;
    if (textForm.mode === "edit-portal" && textForm.portalIndex !== undefined) {
      const entry: DraftPortalTextEntry = {
        id: textForm.entityId,
        originalIndex: textForm.portalIndex,
        portalKey: textForm.portalKey,
        labelKey: textForm.i18nKey.trim(),
        plText: textForm.plText,
        enText: textForm.enText,
      };
      setDraftPortalsByLoc((prev) => ({
        ...prev,
        [activeLocation.id]: { ...(prev[activeLocation.id] ?? {}), [entry.id]: entry },
      }));
      setSelectedUid(`portal:${entry.id}`);
      return;
    }

    const trigEntry: DraftTriggerEntry = {
      kind: textForm.mode === "create-trigger" ? "create" : "edit",
      id: textForm.entityId,
      originalIndex: textForm.triggerIndex,
      x: textForm.bounds.x,
      y: textForm.bounds.y,
      width: textForm.bounds.width,
      height: textForm.bounds.height,
      triggerId: textForm.i18nKey.trim(),
      oneShot: textForm.oneShot,
      plText: textForm.plText,
      enText: textForm.enText,
    };

    setDraftTriggersByLoc((prev) => {
      const current = prev[activeLocation.id] ?? [];
      return {
        ...prev,
        [activeLocation.id]: [...current.filter((item) => item.id !== trigEntry.id), trigEntry],
      };
    });
    setSelectedUid(`trigger:${trigEntry.id}`);
    setTextForm({ ...textForm, mode: "edit-trigger" });
  }, [activeLocation.id, textForm]);

  const captions = useMapCaptions({
    entities,
    draftTriggers,
    draftPortalsMap,
    language,
    selectedUid,
    textForm,
  });

  const patchPayload = useMemo(() => {
    const bp = activeLocation.jsonBlueprint;
    return bp
      ? buildLocationTextPatch(bp, { triggers: draftTriggers, portals: Object.values(draftPortalsMap) })
      : createEmptyPatch(activeLocation);
  }, [activeLocation, draftPortalsMap, draftTriggers]);

  const patchJson = useMemo(() => formatPatchJson(patchPayload), [patchPayload]);

  const handleCopyPatch = useCallback(
    () =>
      copyAndNotify(
        patchJson,
        () => {
          setPatchCopied(true);
          setTimeout(() => setPatchCopied(false), 2200);
        },
        () => setShowPatchPreview(true)
      ),
    [patchJson]
  );

  const handleDownloadPatch = useCallback(
    () => downloadTextFile(`${activeLocation.id}-text-patch.json`, patchJson),
    [activeLocation.id, patchJson]
  );

  return {
    activeLocation,
    toolMode,
    setToolMode,
    viewport,
    setViewport,
    visibleCategories,
    toggleCategory: (cat: MapEntityCategory) =>
      setVisibleCategories((prev) => {
        const next = new Set(prev);
        if (next.has(cat)) next.delete(cat);
        else next.add(cat);
        return next;
      }),
    selectedUid,
    selectedEntity,
    cursorWorld,
    setCursorWorld,
    showCaptions,
    toggleCaptions: () => setShowCaptions((v) => !v),
    entities,
    leverGateLinks,
    captions,
    textForm,
    setTextForm,
    draftsCount: draftTriggers.length + Object.keys(draftPortalsMap).length,
    patchPayload,
    patchJson,
    showPatchPreview,
    openPatchPreview: () => setShowPatchPreview(true),
    patchCopied,
    handleSelectEntity,
    handleCreateTriggerArea,
    openTextEditorForEntity,
    handleApplyDraft,
    handleClearDrafts: () => {
      setDraftTriggersByLoc((prev) => ({ ...prev, [activeLocation.id]: [] }));
      setDraftPortalsByLoc((prev) => ({ ...prev, [activeLocation.id]: {} }));
    },
    handleSuggestKey: () => {
      if (!textForm) return;
      setTextForm({ ...textForm, i18nKey: suggestNarrationKey(activeLocation.id, textForm.beat, existingKeys) });
    },
    handleCopyPatch,
    handleDownloadPatch,
    handleFit: () =>
      setViewport(fitViewportToMap(activeLocation.width, activeLocation.height, MAP_CANVAS_SIZE.width, MAP_CANVAS_SIZE.height)),
    handleZoomIn: () =>
      setViewport((vp) => zoomAroundPoint(vp, vp.zoom * 1.25, MAP_CANVAS_SIZE.width / 2, MAP_CANVAS_SIZE.height / 2)),
    handleZoomOut: () =>
      setViewport((vp) => zoomAroundPoint(vp, vp.zoom / 1.25, MAP_CANVAS_SIZE.width / 2, MAP_CANVAS_SIZE.height / 2)),
  };
}
