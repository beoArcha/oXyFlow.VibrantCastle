import React from "react";
import { Code2, MessageSquarePlus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Code,
  CopyableSnippet,
  Text,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import type { MapEntityCategory, MapEntityItem } from "./mapEntities";

export interface MapInspectorPanelProps {
  readonly selectedEntity: MapEntityItem | null;
  readonly onEditInTextTool: (entity: MapEntityItem) => void;
}

const CATEGORY_BADGE: Record<
  MapEntityCategory,
  "amber" | "red" | "cyan" | "purple" | "green" | "stone"
> = {
  solid: "stone",
  gate: "amber",
  lever: "amber",
  portal: "cyan",
  trigger: "purple",
  spawn: "green",
  enemy: "red",
  hazard: "red",
};

export const MapInspectorPanel: React.FC<MapInspectorPanelProps> = ({
  selectedEntity,
  onEditInTextTool,
}) => {
  const { t } = useI18n();

  const canEditText =
    selectedEntity !== null &&
    (selectedEntity.category === "trigger" ||
      selectedEntity.category === "portal" ||
      Boolean(selectedEntity.textKey));

  return (
    <Card variant="subtle" className="xl:col-span-4 flex flex-col">
      <CardHeader>
        <CardTitle icon={<Code2 className="w-4 h-4 text-amber-400" />}>
          {t("levelsMapInspectorTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!selectedEntity ? (
          <div className="rounded-lg border border-stone-800 bg-black/40 p-4">
            <Text size="xs" variant="muted">
              {t("levelsMapInspectorEmpty")}
            </Text>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge variant={CATEGORY_BADGE[selectedEntity.category]}>
                  {selectedEntity.category}
                </Badge>
                <Code size="xs" className="truncate">
                  {selectedEntity.id}
                </Code>
              </div>
              {selectedEntity.targetId && (
                <Badge variant="cyan">{`-> ${selectedEntity.targetId}`}</Badge>
              )}
            </div>

            <Text size="xs" variant="muted" className="font-mono">
              {t("levelsMapTextBoundsLabel", {
                x: Math.round(selectedEntity.x),
                y: Math.round(selectedEntity.y),
                w: Math.round(selectedEntity.width),
                h: Math.round(selectedEntity.height),
              })}
            </Text>

            {canEditText && (
              <Button
                size="sm"
                variant="primary"
                icon={<MessageSquarePlus size={14} />}
                onClick={() => onEditInTextTool(selectedEntity)}
              >
                {t("levelsMapInspectorEditText")}
              </Button>
            )}

            <CopyableSnippet
              text={JSON.stringify(selectedEntity.rawJson, null, 2)}
              title={selectedEntity.id}
              copyLabel={t("levelsMapInspectorCopyJson")}
              copiedLabel={t("levelsMapInspectorCopied")}
              maxHeightClass="max-h-80"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

MapInspectorPanel.displayName = "MapInspectorPanel";
export default MapInspectorPanel;
