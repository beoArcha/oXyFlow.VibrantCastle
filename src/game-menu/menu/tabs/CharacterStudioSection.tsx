import React, { useState } from "react";
import { Eye, Layers, Film } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardContent } from "@ui";
import { CharacterStage, AtlasSheetViewer } from "@game-menu/character";
import { useSettings } from "@context/GameContext";
import { useI18n } from "@context/I18nContext";
import { useSpritePreviewState } from "../hooks/useSpritePreviewState";

export const CharacterStudioSection: React.FC = () => {
  const { displaySettings } = useSettings();
  const { t } = useI18n();

  const {
    previewCharacter,
    previewMood,
    previewAction,
    setPreviewAction,
    previewSpeed,
    setPreviewSpeed,
    previewScale,
    setPreviewScale,
    selectCharacter,
  } = useSpritePreviewState();

  const [studioMode, setStudioMode] = useState<"stage" | "atlas">("stage");
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  return (
    <Card variant="subtle">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <CardTitle icon={<Eye className="w-4 h-4 text-amber-400" />}>
              {t("studioTitle")}
            </CardTitle>

            <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-stone-800">
              <Button
                size="sm"
                variant={studioMode === "stage" ? "primary" : "secondary"}
                icon={<Film size={13} />}
                onClick={() => setStudioMode("stage")}
                className="py-1 px-2.5 h-7 text-xs"
              >
                {t("studioStageTab")}
              </Button>
              <Button
                size="sm"
                variant={studioMode === "atlas" ? "primary" : "secondary"}
                icon={<Layers size={13} />}
                onClick={() => setStudioMode("atlas")}
                className="py-1 px-2.5 h-7 text-xs"
              >
                {t("studioAtlasTab")}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={previewCharacter === "valen" ? "primary" : "secondary"}
              onClick={() => selectCharacter("valen")}
              className="text-xs py-1 h-7"
            >
              Valen
            </Button>
            <Button
              size="sm"
              variant={previewCharacter === "aurelia" ? "primary" : "secondary"}
              onClick={() => selectCharacter("aurelia")}
              className="text-xs py-1 h-7"
            >
              Aurelia
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {studioMode === "stage" ? (
          <CharacterStage
            characterId={previewCharacter}
            mood={previewMood}
            scalingFilter={displaySettings.scalingFilter}
            activeAction={previewAction}
            onActionChange={setPreviewAction}
            playbackSpeed={previewSpeed}
            onSpeedChange={setPreviewSpeed}
            scale={previewScale}
            onScaleChange={setPreviewScale}
            flipHorizontal={flipHorizontal}
            onToggleFlip={() => setFlipHorizontal((f) => !f)}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
          />
        ) : (
          <AtlasSheetViewer
            characterId={previewCharacter}
            activeAnimation={previewAction}
          />
        )}
      </CardContent>
    </Card>
  );
};

CharacterStudioSection.displayName = "CharacterStudioSection";

export default CharacterStudioSection;

