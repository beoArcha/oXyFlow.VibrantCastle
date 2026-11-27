import React, { useMemo } from "react";
import {
  Hand,
  Maximize2,
  MessageSquare,
  MessageSquarePlus,
  MousePointer,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Code, Select, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import { ALL_LOCATIONS, LocationId } from "@game/locations";
import { MapBrowserCanvas } from "./MapBrowserCanvas";
import { MapInspectorPanel } from "./MapInspectorPanel";
import { MapTextToolPanel } from "./MapTextToolPanel";
import type { MapEntityCategory } from "./mapEntities";
import { ALL_MAP_CATEGORIES, MAP_CANVAS_SIZE, useMapBrowserState } from "./useMapBrowserState";

export interface MapBrowserPanelProps {
  readonly selectedLocationId: LocationId;
  readonly onSelectLocationId: (id: LocationId) => void;
}

const CATEGORY_LABEL_KEYS: Record<MapEntityCategory, string> = {
  solid: "levelsMapKindSolid",
  gate: "levelsMapKindGate",
  lever: "levelsMapKindLever",
  portal: "levelsMapKindPortal",
  trigger: "levelsMapKindTrigger",
  spawn: "levelsMapKindSpawn",
  enemy: "levelsMapKindEnemy",
  hazard: "levelsMapKindHazard",
};

export const MapBrowserPanel: React.FC<MapBrowserPanelProps> = ({
  selectedLocationId,
  onSelectLocationId,
}) => {
  const { t } = useI18n();
  const state = useMapBrowserState(selectedLocationId);

  const locationOptions = useMemo(
    () =>
      ALL_LOCATIONS.map((loc) => ({
        value: loc.id,
        label: `${loc.id} · ${t(loc.nameKey)} (${loc.width}×${loc.height})`,
      })),
    [t]
  );

  return (
    <div id="levels-map-browser" className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      <Card variant="subtle" className="xl:col-span-8 flex flex-col">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{t("levelsMapBrowserView")}</CardTitle>
            <div className="w-full sm:w-80">
              <Select
                size="sm"
                aria-label={t("levelsMapSelectLocation")}
                options={locationOptions}
                value={state.activeLocation.id}
                onChange={(e) => onSelectLocationId(e.target.value as LocationId)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/80">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant={state.toolMode === "inspect" ? "primary" : "secondary"}
                icon={<MousePointer size={13} />}
                onClick={() => state.setToolMode("inspect")}
              >
                {t("levelsMapToolInspect")}
              </Button>
              <Button
                size="sm"
                variant={state.toolMode === "pan" ? "primary" : "secondary"}
                icon={<Hand size={13} />}
                onClick={() => state.setToolMode("pan")}
              >
                {t("levelsMapToolPan")}
              </Button>
              <Button
                size="sm"
                variant={state.toolMode === "text" ? "primary" : "secondary"}
                icon={<MessageSquarePlus size={13} />}
                onClick={() => state.setToolMode("text")}
              >
                {t("levelsMapToolText")}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant={state.showCaptions ? "primary" : "ghost"}
                icon={<MessageSquare size={12} />}
                onClick={state.toggleCaptions}
              >
                {t("levelsMapShowCaptions")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={<Maximize2 size={12} />}
                onClick={state.handleFit}
              >
                {t("levelsMapZoomFit")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={<ZoomOut size={12} />}
                aria-label={t("levelsMapZoomOut")}
                onClick={state.handleZoomOut}
              />
              <Code size="xs" className="tabular-nums">
                {`${Math.round(state.viewport.zoom * 100)}%`}
              </Code>
              <Button
                size="sm"
                variant="ghost"
                icon={<ZoomIn size={12} />}
                aria-label={t("levelsMapZoomIn")}
                onClick={state.handleZoomIn}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-2.5">
          <MapBrowserCanvas
            location={state.activeLocation}
            viewport={state.viewport}
            onViewportChange={state.setViewport}
            toolMode={state.toolMode}
            entities={state.entities}
            leverGateLinks={state.leverGateLinks}
            visibleCategories={state.visibleCategories}
            selectedUid={state.selectedUid}
            captions={state.captions}
            showCaptions={state.showCaptions}
            canvasSize={MAP_CANVAS_SIZE}
            onSelectEntity={state.handleSelectEntity}
            onCreateTriggerArea={state.handleCreateTriggerArea}
            onCursorWorldMove={state.setCursorWorld}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <Text size="xs" variant="muted">
                {t("levelsMapLayerToggles")}
              </Text>
              {ALL_MAP_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={state.visibleCategories.has(cat) ? "primary" : "ghost"}
                  onClick={() => state.toggleCategory(cat)}
                >
                  {t(CATEGORY_LABEL_KEYS[cat])}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="stone">
                {t("levelsMapEntitiesCount", { count: state.entities.length })}
              </Badge>
              {state.cursorWorld && (
                <Code size="xs" className="tabular-nums">
                  {t("levelsMapCursorWorld", { x: state.cursorWorld.x, y: state.cursorWorld.y })}
                </Code>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {state.toolMode === "text" ? (
        <MapTextToolPanel
          form={state.textForm}
          draftsCount={state.draftsCount}
          patchPayload={state.patchPayload}
          patchJson={state.patchJson}
          showPatchPreview={state.showPatchPreview}
          patchCopied={state.patchCopied}
          onFormChange={state.setTextForm}
          onSuggestKey={state.handleSuggestKey}
          onApplyDraft={state.handleApplyDraft}
          onClearDrafts={state.handleClearDrafts}
          onExportPatch={state.openPatchPreview}
          onCopyPatch={state.handleCopyPatch}
          onDownloadPatch={state.handleDownloadPatch}
        />
      ) : (
        <MapInspectorPanel
          selectedEntity={state.selectedEntity}
          onEditInTextTool={state.openTextEditorForEntity}
        />
      )}
    </div>
  );
};

MapBrowserPanel.displayName = "MapBrowserPanel";
export default MapBrowserPanel;
