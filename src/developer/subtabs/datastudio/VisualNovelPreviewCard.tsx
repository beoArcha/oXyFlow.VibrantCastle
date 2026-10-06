import React, { useState, useMemo } from "react";
import { MessageSquare, UserCheck, ChevronRight, BookOpen, Skull } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from "@ui";
import { CharacterPortrait } from "@components/character/CharacterPortrait";
import dialoguesVnJson from "@data/narrative/dialogues_vn.json";
import { VisualNovelSceneJsonSchema } from "@lib/schemas/visualNovelSchema";
import { useI18n } from "@context/I18nContext";
import {
  discoverSceneSpeakers,
  resolveEmotionsForSpeaker,
  calculateGridCoordinates,
} from "./services/visualNovelService";

export const VisualNovelPreviewCard: React.FC = () => {
  const { t } = useI18n();
  const scene = dialoguesVnJson.scenes.scene_clocktower_meeting as unknown as VisualNovelSceneJsonSchema;
  const nodeKeys = useMemo(() => Object.keys(scene.nodes), [scene]);

  const [activeNodeId, setActiveNodeId] = useState<string>(scene.initialNodeId);
  const currentNode = useMemo(() => {
    return scene.nodes[activeNodeId] ?? scene.nodes[scene.initialNodeId];
  }, [scene, activeNodeId]);

  const speakerOptions = useMemo(
    () =>
      discoverSceneSpeakers(scene, {
        heroValen: t("dataStudioVnSpeakerHeroValen"),
        heroAurelia: t("dataStudioVnSpeakerHeroAurelia"),
        narrator: t("dataStudioVnSpeakerNarrator"),
        bossPrefix: t("dataStudioVnSpeakerBossPrefix"),
        enemyPrefix: t("dataStudioVnSpeakerEnemyPrefix"),
      }),
    [scene, t]
  );

  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(
    currentNode.speaker || "valen"
  );
  const [selectedEmotion, setSelectedEmotion] = useState<string>("stoic");

  const effectiveSpeaker = currentNode.speaker || selectedSpeakerId;
  const availableEmotions = useMemo(
    () => resolveEmotionsForSpeaker(effectiveSpeaker),
    [effectiveSpeaker]
  );
  const effectiveEmotion = currentNode.emotion || selectedEmotion;

  const { row, col, index } = useMemo(
    () => calculateGridCoordinates(effectiveEmotion, availableEmotions),
    [effectiveEmotion, availableEmotions]
  );

  const nodeOptions = useMemo(
    () => nodeKeys.map((key) => ({ value: key, label: key })),
    [nodeKeys]
  );

  const emotionSelectOptions = useMemo(
    () => availableEmotions.map((emo) => ({ value: emo, label: emo })),
    [availableEmotions]
  );

  const isNarrator = effectiveSpeaker === "narrator";
  const isHero = effectiveSpeaker === "valen" || effectiveSpeaker === "aurelia";

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<MessageSquare className="w-4 h-4 text-sky-400" />}>
          {t("dataStudioVnCardTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg">
          <Select
            id="vn-select-node"
            label={t("dataStudioVnDialogueNode")}
            value={activeNodeId}
            onChange={(e) => {
              const nextNodeId = e.target.value;
              setActiveNodeId(nextNodeId);
              const node = scene.nodes[nextNodeId];
              if (node?.speaker) {
                setSelectedSpeakerId(node.speaker);
              }
            }}
            options={nodeOptions}
            variant="castle"
            size="sm"
          />

          <Select
            id="vn-select-character"
            label={t("dataStudioVnSpeakerSelectLabel")}
            value={effectiveSpeaker}
            onChange={(e) => {
              const speaker = e.target.value;
              setSelectedSpeakerId(speaker);
              const nextEmotions = resolveEmotionsForSpeaker(speaker);
              setSelectedEmotion(nextEmotions[0] || "neutral");
            }}
            options={speakerOptions}
            variant="castle"
            size="sm"
          />

          <Select
            id="vn-select-emotion"
            label={t("dataStudioVnStanceLabel")}
            value={effectiveEmotion}
            onChange={(e) => setSelectedEmotion(e.target.value)}
            options={emotionSelectOptions}
            variant="castle"
            size="sm"
          />
        </div>

        <div className="flex items-center gap-3 text-xs bg-[#140602]/80 border border-amber-900/40 rounded-lg px-3 py-2 flex-wrap">
          <span className="text-amber-200/70">
            {t("dataStudioVnActiveEmotion")}:{" "}
            <strong className="text-amber-300 font-mono">{effectiveEmotion}</strong>
          </span>
          <span className="text-amber-200/70">
            {t("dataStudioVnGridCell")}:{" "}
            <span className="text-amber-100 font-medium">
              R{row}, C{col} (Idx: {index})
            </span>
          </span>
          <span className="text-amber-200/70">
            {t("dataStudioVnPosition")}:{" "}
            <strong className="text-amber-300">{currentNode.position ?? "center"}</strong>
          </span>
        </div>

        <div className="relative bg-[#0d0402] border border-amber-900/70 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 min-h-[160px]">
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            {isHero ? (
              <CharacterPortrait
                characterId={effectiveSpeaker}
                mood={effectiveEmotion}
                size="xl"
                variant="framed"
              />
            ) : isNarrator ? (
              <div
                className="w-32 h-32 rounded-lg border border-amber-600/60 bg-[#1e0e05] flex flex-col items-center justify-center gap-2 text-amber-300 shadow-md"
                role="img"
                aria-label={t("dataStudioVnSpeakerNarrator")}
              >
                <BookOpen size={36} className="text-amber-400" />
                <span className="text-[10px] font-serif uppercase tracking-wider font-bold">
                  {t("dataStudioVnSpeakerNarrator")}
                </span>
              </div>
            ) : (
              <div
                className="w-32 h-32 rounded-lg border border-rose-700/60 bg-[#1c0604] flex flex-col items-center justify-center gap-2 text-rose-300 shadow-md"
                role="img"
                aria-label={effectiveSpeaker}
              >
                <Skull size={36} className="text-rose-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-1 text-center truncate max-w-full">
                  {effectiveSpeaker}
                </span>
              </div>
            )}
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
              {currentNode.speakerNameKey ? t(currentNode.speakerNameKey) : effectiveSpeaker}
            </span>
          </div>

          <section
            aria-label={t("dataStudioVnSpeakerSpeechAria")}
            aria-live="polite"
            className="flex-1 w-full bg-[#1c0803]/90 border border-amber-800/60 rounded-lg p-3.5 flex flex-col justify-between gap-3 shadow-lg"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                <span className="flex items-center gap-1">
                  <UserCheck size={13} />
                  {currentNode.speakerNameKey ? t(currentNode.speakerNameKey) : effectiveSpeaker}
                </span>
                <span className="font-mono text-[10px] text-amber-200/50">
                  {t("dataStudioVnNodeLabel")}: {currentNode.id}
                </span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed italic">
                "{t(currentNode.dialogueKey)}"
              </p>
            </div>

            <div className="flex flex-col gap-1.5 pt-2 border-t border-amber-900/40">
              {currentNode.choices && currentNode.choices.length > 0 ? (
                <div role="group" aria-label={t("dataStudioVnPlayerDecisions")} className="flex flex-col gap-1">
                  <span className="text-[10px] font-medium text-amber-200/60">
                    {t("dataStudioVnPlayerDecisions")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentNode.choices.map((choice) => (
                      <Button
                        key={choice.choiceId}
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          if (scene.nodes[choice.targetNodeId]) {
                            setActiveNodeId(choice.targetNodeId);
                          }
                        }}
                      >
                        {t(choice.textKey)}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : currentNode.nextNodeId ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="self-end"
                  icon={<ChevronRight size={13} />}
                  onClick={() => {
                    if (currentNode.nextNodeId && scene.nodes[currentNode.nextNodeId]) {
                      setActiveNodeId(currentNode.nextNodeId);
                    }
                  }}
                >
                  {t("dataStudioVnContinueDialogue")}
                </Button>
              ) : (
                <span className="text-[11px] text-emerald-400 font-medium self-end">
                  • {t("dataStudioVnEndOfScene")}
                </span>
              )}
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
};
