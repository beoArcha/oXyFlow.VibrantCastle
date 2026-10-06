import React, { useState, useMemo } from "react";
import { MessageSquare, UserCheck, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Select } from "@ui";
import { CharacterPortrait } from "@components/character/CharacterPortrait";
import dialoguesVnJson from "@data/narrative/dialogues_vn.json";
import {
  VALEN_PORTRAIT_EMOTIONS,
  AURELIA_PORTRAIT_EMOTIONS,
  VisualNovelSceneJsonSchema,
} from "@lib/schemas/visualNovelSchema";
import { useI18n } from "@context/I18nContext";

export const VisualNovelPreviewCard: React.FC = () => {
  const { t } = useI18n();
  const scene = dialoguesVnJson.scenes.scene_clocktower_meeting as unknown as VisualNovelSceneJsonSchema;
  const nodeKeys = useMemo(() => Object.keys(scene.nodes), [scene]);

  const [activeNodeId, setActiveNodeId] = useState<string>(scene.initialNodeId);
  const [selectedCharacter, setSelectedCharacter] = useState<"valen" | "aurelia">("valen");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("stoic");

  const currentNode = useMemo(() => {
    return scene.nodes[activeNodeId] ?? scene.nodes[scene.initialNodeId];
  }, [scene, activeNodeId]);

  const currentSpeaker = currentNode.speaker ?? selectedCharacter;
  const currentEmotion = currentNode.emotion ?? selectedEmotion;

  // Calculate 5x5 grid index
  const emotionList = selectedCharacter === "valen" ? VALEN_PORTRAIT_EMOTIONS : AURELIA_PORTRAIT_EMOTIONS;
  const emotionIndex = emotionList.indexOf(currentEmotion as any);
  const gridRow = emotionIndex >= 0 ? Math.floor(emotionIndex / 5) : 0;
  const gridCol = emotionIndex >= 0 ? emotionIndex % 5 : 0;

  const nodeOptions = useMemo(
    () => nodeKeys.map((key) => ({ value: key, label: key })),
    [nodeKeys]
  );

  const characterOptions = useMemo(
    () => [
      { value: "valen", label: "Valen" },
      { value: "aurelia", label: "Aurelia" },
    ],
    []
  );

  const emotionOptions = useMemo(
    () => emotionList.map((emo) => ({ value: emo, label: emo })),
    [emotionList]
  );

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<MessageSquare className="w-4 h-4 text-sky-400" />}>
          {t("dataStudioVnCardTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Node & Character Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg">
          <Select
            id="vn-select-node"
            label={t("dataStudioVnDialogueNode")}
            value={activeNodeId}
            onChange={(e) => setActiveNodeId(e.target.value)}
            options={nodeOptions}
            variant="castle"
            size="sm"
          />

          <Select
            id="vn-select-character"
            label={t("dataStudioVnPortraitCharacter")}
            value={selectedCharacter}
            onChange={(e) => {
              const char = e.target.value as "valen" | "aurelia";
              setSelectedCharacter(char);
              setSelectedEmotion(char === "valen" ? "stoic" : "curious");
            }}
            options={characterOptions}
            variant="castle"
            size="sm"
          />

          <Select
            id="vn-select-emotion"
            label={t("dataStudioVnEmotionMatrix")}
            value={selectedEmotion}
            onChange={(e) => setSelectedEmotion(e.target.value)}
            options={emotionOptions}
            variant="castle"
            size="sm"
          />
        </div>

        {/* Emotion Matrix Info Badge */}
        <div className="flex items-center gap-3 text-xs bg-[#140602]/80 border border-amber-900/40 rounded-lg px-3 py-2 flex-wrap">
          <span className="text-amber-200/70">
            {t("dataStudioVnActiveEmotion")}:{" "}
            <strong className="text-amber-300 font-mono">{currentEmotion}</strong>
          </span>
          <span className="text-amber-200/70">
            {t("dataStudioVnGridCell")}:{" "}
            <span className="text-amber-100 font-medium">
              R{gridRow}, C{gridCol} (Idx: {emotionIndex >= 0 ? emotionIndex : 0})
            </span>
          </span>
          <span className="text-amber-200/70">
            {t("dataStudioVnPosition")}:{" "}
            <strong className="text-amber-300">{currentNode.position ?? "center"}</strong>
          </span>
        </div>

        {/* Live Visual Novel Stage Mockup */}
        <div className="relative bg-[#0d0402] border border-amber-900/70 rounded-lg p-4 flex flex-col md:flex-row items-center gap-4 min-h-[160px]">
          {/* Portrait Container */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <CharacterPortrait
              characterId={currentSpeaker}
              mood={currentEmotion}
              size="xl"
              variant="framed"
            />
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
              {currentSpeaker}
            </span>
          </div>

          {/* Dialogue Speech Bubble */}
          <div className="flex-1 w-full bg-[#1c0803]/90 border border-amber-800/60 rounded-lg p-3.5 flex flex-col justify-between gap-3 shadow-lg">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                <span className="flex items-center gap-1">
                  <UserCheck size={13} />
                  {currentNode.speakerNameKey ? t(currentNode.speakerNameKey) : currentSpeaker}
                </span>
                <span className="font-mono text-[10px] text-amber-200/50">
                  {t("dataStudioVnNodeLabel")}: {currentNode.id}
                </span>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed italic">
                "{t(currentNode.dialogueKey)}"
              </p>
            </div>

            {/* Next / Choice Actions */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-amber-900/40">
              {currentNode.choices && currentNode.choices.length > 0 ? (
                <div className="flex flex-col gap-1">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
