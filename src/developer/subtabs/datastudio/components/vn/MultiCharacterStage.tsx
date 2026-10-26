import React from "react";
import { BookOpen, Skull, Volume2, User } from "lucide-react";
import { CharacterPortrait } from "@game-menu/character/CharacterPortrait";
import { Text, IconText } from "@ui";
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
              <Text as="span" family="mono" size="2xs" uppercase weight="bold" className="tracking-wider px-1 text-center truncate max-w-full">
                {actor.id}
              </Text>
            </div>
          ) : (
            <div
              className="w-32 h-32 rounded-lg border border-amber-800/60 bg-stone-950 flex flex-col items-center justify-center gap-2 text-amber-300 shadow-md"
              role="img"
              aria-label={actor.displayName}
            >
              <User size={36} className="text-amber-400/80" />
              <Text as="span" family="mono" size="2xs" uppercase weight="bold" className="tracking-wider px-1 text-center truncate max-w-full">
                {actor.displayName}
              </Text>
            </div>
          )}

          {isSpeaking && (
            <IconText
              icon={<Volume2 size={10} />}
              as="span"
              weight="black"
              transform="uppercase"
              size="3xs"
              className="absolute -top-2.5 -right-2 bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded-full shadow gap-0.5"
            >
              Voice
            </IconText>
          )}
        </div>

        <div className="flex flex-col items-center text-center">
          <Text
            as="span"
            size="xs"
            weight="semibold"
            className={`tracking-wider ${
              isSpeaking ? "text-amber-300" : "text-stone-400"
            }`}
          >
            {actor.displayName}
          </Text>
          <Text as="span" family="mono" size="2xs" className="text-amber-400/70">
            {actor.emotion}
          </Text>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative w-full min-h-[220px] rounded-lg border border-amber-900/60 bg-stone-950 p-4 flex flex-col justify-between overflow-hidden shadow-inner ${className}`}
    >
      <Text as="div" family="mono" size="2xs" uppercase className="absolute top-2 left-3 tracking-widest text-amber-200/40 select-none">
        Stage: {backgroundId}
      </Text>

      {isNarratorSpeaking && (
        <div className="self-center z-20 px-3.5 py-1.5 rounded-full bg-amber-950/90 border border-amber-500/70 shadow-md animate-pulse">
          <IconText
            icon={<BookOpen size={14} className="text-amber-400 shrink-0" />}
            family="serif"
            size="xs"
            weight="bold"
            transform="uppercase"
            tracking="wider"
            className="text-amber-300 gap-2"
          >
            {t("dataStudioVnSpeakerNarrator")}
          </IconText>
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
