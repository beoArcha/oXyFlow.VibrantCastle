import React from "react";
import { BookOpen, Skull, Volume2, User } from "lucide-react";
import { CharacterPortrait } from "@game-menu/character/CharacterPortrait";
import { StageActor } from "../../types/visualNovelStudioTypes";
import { useI18n } from "@context/I18nContext";

export interface MultiCharacterStageProps {
  readonly actors: StageActor[];
  readonly isNarratorSpeaking: boolean;
  readonly backgroundId?: string;
  readonly className?: string;
}

/**
 * 3-Zone Theatrical Stage visualizer for Visual Novel scenes supporting multiple characters simultaneously.
 * Places characters across Left, Center, and Right zones with visual focus hierarchy (active speaker vs listeners).
 */
export const MultiCharacterStage: React.FC<MultiCharacterStageProps> = ({
  actors,
  isNarratorSpeaking,
  backgroundId = "bg_clocktower",
  className = "",
}) => {
  const { t } = useI18n();

  const leftActors = actors.filter((a) => a.position === "left");
  const centerActors = actors.filter((a) => a.position === "center");
  const rightActors = actors.filter((a) => a.position === "right");

  const renderActorCard = (actor: StageActor) => {
    const isSpeaking = actor.isActive && !isNarratorSpeaking;

    return (
      <div
        key={actor.id}
        className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
          isSpeaking
            ? "scale-100 opacity-100 z-10"
            : "scale-90 opacity-60 hover:opacity-85 z-0"
        }`}
      >
        <div
          className={`relative rounded-lg p-0.5 transition-all ${
            isSpeaking
              ? "ring-2 ring-amber-400 shadow-lg shadow-amber-950/70"
              : "ring-1 ring-stone-800"
          }`}
        >
          {actor.isHero ? (
            <CharacterPortrait
              characterId={actor.id}
              mood={actor.emotion}
              size="xl"
              variant="framed"
            />
          ) : actor.id.includes("boss") || actor.id.includes("beast") || actor.id.includes("enemy") ? (
            <div
              className="w-32 h-32 rounded-lg border border-rose-700/60 bg-rose-950/80 flex flex-col items-center justify-center gap-2 text-rose-300 shadow-md"
              role="img"
              aria-label={actor.displayName}
            >
              <Skull size={36} className="text-rose-400" />
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-1 text-center truncate max-w-full">
                {actor.id}
              </span>
            </div>
          ) : (
            <div
              className="w-32 h-32 rounded-lg border border-amber-800/60 bg-stone-950 flex flex-col items-center justify-center gap-2 text-amber-300 shadow-md"
              role="img"
              aria-label={actor.displayName}
            >
              <User size={36} className="text-amber-400/80" />
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-1 text-center truncate max-w-full">
                {actor.displayName}
              </span>
            </div>
          )}

          {isSpeaking && (
            <span className="absolute -top-2.5 -right-2 bg-amber-500 text-stone-950 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shadow flex items-center gap-0.5">
              <Volume2 size={10} />
              <span>Voice</span>
            </span>
          )}
        </div>

        <div className="flex flex-col items-center text-center">
          <span
            className={`text-xs font-semibold tracking-wider ${
              isSpeaking ? "text-amber-300" : "text-stone-400"
            }`}
          >
            {actor.displayName}
          </span>
          <span className="text-[10px] font-mono text-amber-400/70">
            {actor.emotion}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative w-full min-h-[220px] rounded-lg border border-amber-900/60 bg-stone-950 p-4 flex flex-col justify-between overflow-hidden shadow-inner ${className}`}
    >
      <div className="absolute top-2 left-3 text-[10px] font-mono uppercase tracking-widest text-amber-200/40 select-none">
        Stage: {backgroundId}
      </div>

      {isNarratorSpeaking && (
        <div className="self-center z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/90 border border-amber-500/70 text-amber-300 shadow-md animate-pulse">
          <BookOpen size={14} className="text-amber-400 shrink-0" />
          <span className="text-xs font-serif font-bold uppercase tracking-wider">
            {t("dataStudioVnSpeakerNarrator")}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 items-end min-h-[170px] pt-4">
        <div className="flex justify-start items-end gap-2 flex-wrap">
          {leftActors.map(renderActorCard)}
        </div>

        <div className="flex justify-center items-end gap-2 flex-wrap">
          {centerActors.map(renderActorCard)}
        </div>

        <div className="flex justify-end items-end gap-2 flex-wrap">
          {rightActors.map(renderActorCard)}
        </div>
      </div>
    </div>
  );
};
