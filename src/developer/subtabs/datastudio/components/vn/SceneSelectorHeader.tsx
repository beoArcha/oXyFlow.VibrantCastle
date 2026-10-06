import React from "react";
import { BookOpen, MapPin, Music } from "lucide-react";
import { Select, SelectOption, Badge } from "@ui";
import { useI18n } from "@context/I18nContext";
import { VisualNovelSceneJsonSchema } from "@lib/schemas/visualNovelSchema";

export interface SceneSelectorHeaderProps {
  readonly selectedSceneId: string;
  readonly onSelectScene: (sceneId: string) => void;
  readonly sceneOptions: SelectOption[];
  readonly currentScene: VisualNovelSceneJsonSchema;
}

/**
 * Scene Selector Header for Visual Novel studio, presenting scene switcher and narrative metadata.
 */
export const SceneSelectorHeader: React.FC<SceneSelectorHeaderProps> = ({
  selectedSceneId,
  onSelectScene,
  sceneOptions,
  currentScene,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-stone-950/70 border border-stone-800/80 rounded-lg">
      <div className="flex-1 min-w-[240px] max-w-md">
        <Select
          id="vn-scene-selector"
          label={t("dataStudioVnCardTitle")}
          value={selectedSceneId}
          onChange={(e) => onSelectScene(e.target.value)}
          options={sceneOptions}
          variant="castle"
          size="sm"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap text-xs text-amber-200/80">
        {currentScene.metadata?.locationId && (
          <Badge
            variant="amber"
            icon={<MapPin size={12} className="text-amber-400 shrink-0" />}
          >
            <span className="font-mono">{currentScene.metadata.locationId}</span>
          </Badge>
        )}
        {currentScene.metadata?.actId && (
          <Badge
            variant="amber"
            icon={<BookOpen size={12} className="text-amber-400 shrink-0" />}
          >
            <span className="font-mono">{currentScene.metadata.actId}</span>
          </Badge>
        )}
        {currentScene.musicCue && (
          <Badge
            variant="cyan"
            icon={<Music size={12} className="text-cyan-400 shrink-0" />}
          >
            <span className="font-mono text-stone-300 truncate max-w-[140px]">
              {currentScene.musicCue}
            </span>
          </Badge>
        )}
      </div>
    </div>
  );
};
