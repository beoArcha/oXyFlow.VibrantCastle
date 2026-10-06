import React, { useState, useMemo } from "react";
import { MessageSquare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Select } from "@ui";
import dialoguesVnJson from "@data/narrative/dialogues_vn.json";
import {
  VisualNovelSceneJsonSchema,
  VisualNovelDocumentJsonSchema,
} from "@lib/schemas/visualNovelSchema";
import { useI18n } from "@context/I18nContext";
import {
  discoverSceneSpeakers,
  resolveEmotionsForSpeaker,
  calculateGridCoordinates,
  resolveSceneRoster,
  getSceneSummaries,
} from "./services/visualNovelService";
import { SceneSelectorHeader } from "./components/vn/SceneSelectorHeader";
import { MultiCharacterStage } from "./components/vn/MultiCharacterStage";
import { DialogueBubble } from "./components/vn/DialogueBubble";
import { ExportToolbar } from "./components/ExportToolbar";

export const VisualNovelPreviewCard: React.FC = () => {
  const { t } = useI18n();
  const vnDocument = dialoguesVnJson as VisualNovelDocumentJsonSchema;

  const sceneSummaries = useMemo(
    () => getSceneSummaries(vnDocument, (key) => t(key)),
    [vnDocument, t]
  );

  const sceneOptions = useMemo(
    () =>
      sceneSummaries.map((s) => ({
        value: s.sceneId,
        label: `${s.title} (${s.sceneId})`,
      })),
    [sceneSummaries]
  );

  const [selectedSceneId, setSelectedSceneId] = useState<string>(
    sceneSummaries[0]?.sceneId ?? "scene_clocktower_meeting"
  );

  const currentScene: VisualNovelSceneJsonSchema = useMemo(() => {
    return vnDocument.scenes[selectedSceneId] ?? Object.values(vnDocument.scenes)[0];
  }, [vnDocument, selectedSceneId]);

  const nodeKeys = useMemo(
    () => Object.keys(currentScene.nodes ?? {}),
    [currentScene]
  );

  const [activeNodeId, setActiveNodeId] = useState<string>(
    currentScene.initialNodeId ?? nodeKeys[0] ?? ""
  );

  const currentNode = useMemo(() => {
    return (
      currentScene.nodes[activeNodeId] ??
      currentScene.nodes[currentScene.initialNodeId] ??
      Object.values(currentScene.nodes)[0]
    );
  }, [currentScene, activeNodeId]);

  const speakerOptions = useMemo(
    () =>
      discoverSceneSpeakers(currentScene, {
        heroValen: t("dataStudioVnSpeakerHeroValen"),
        heroAurelia: t("dataStudioVnSpeakerHeroAurelia"),
        narrator: t("dataStudioVnSpeakerNarrator"),
        bossPrefix: t("dataStudioVnSpeakerBossPrefix"),
        enemyPrefix: t("dataStudioVnSpeakerEnemyPrefix"),
      }),
    [currentScene, t]
  );

  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(
    currentNode?.speaker || "valen"
  );
  const [selectedEmotion, setSelectedEmotion] = useState<string>("stoic");

  const effectiveSpeaker = currentNode?.speaker || selectedSpeakerId;
  const availableEmotions = useMemo(
    () => resolveEmotionsForSpeaker(effectiveSpeaker),
    [effectiveSpeaker]
  );
  const effectiveEmotion = currentNode?.emotion || selectedEmotion;

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

  const stageActors = useMemo(() => {
    return resolveSceneRoster(
      currentScene,
      currentNode,
      effectiveSpeaker,
      effectiveEmotion,
      (keyOrId) => (keyOrId.startsWith("char") || keyOrId.startsWith("vn") ? t(keyOrId) : keyOrId)
    );
  }, [currentScene, currentNode, effectiveSpeaker, effectiveEmotion, t]);

  const handleSelectScene = (sceneId: string) => {
    setSelectedSceneId(sceneId);
    const nextScene = vnDocument.scenes[sceneId];
    if (nextScene) {
      setActiveNodeId(nextScene.initialNodeId);
      const firstNode = nextScene.nodes[nextScene.initialNodeId];
      if (firstNode?.speaker) {
        setSelectedSpeakerId(firstNode.speaker);
      }
    }
  };

  const handleSelectNode = (nodeId: string) => {
    if (currentScene.nodes[nodeId]) {
      setActiveNodeId(nodeId);
      const targetNode = currentScene.nodes[nodeId];
      if (targetNode?.speaker) {
        setSelectedSpeakerId(targetNode.speaker);
        const nextEmotions = resolveEmotionsForSpeaker(targetNode.speaker);
        setSelectedEmotion(targetNode.emotion ?? nextEmotions[0] ?? "neutral");
      }
    }
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<MessageSquare className="w-4 h-4 text-sky-400" />}>
            {t("dataStudioVnCardTitle")}
          </CardTitle>
          <ExportToolbar
            data={currentScene}
            filename={`${currentScene.sceneId || "scene"}.json`}
            modalTitle={`${t("dataStudioExportModalTitle")}: ${currentScene.sceneId}`}
            isValid={true}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SceneSelectorHeader
          selectedSceneId={selectedSceneId}
          onSelectScene={handleSelectScene}
          sceneOptions={sceneOptions}
          currentScene={currentScene}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg">
          <Select
            id="vn-select-node"
            label={t("dataStudioVnDialogueNode")}
            value={activeNodeId}
            onChange={(e) => handleSelectNode(e.target.value)}
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

        <div className="flex items-center gap-3 text-xs bg-stone-950/80 border border-amber-900/40 rounded-lg px-3 py-2 flex-wrap">
          <span className="text-amber-200/70">
            {t("dataStudioVnActiveEmotion")}:{" "}
            <strong className="text-amber-300 font-mono">{effectiveEmotion}</strong>
          </span>
          <span className="text-amber-200/70">
            {t("dataStudioVnGridCell")}:{" "}
            <span className="text-amber-100 font-medium font-mono">
              R{row}, C{col} (Idx: {index})
            </span>
          </span>
          <span className="text-amber-200/70">
            {t("dataStudioVnPosition")}:{" "}
            <strong className="text-amber-300 font-mono">{currentNode.position ?? "center"}</strong>
          </span>
          <span className="text-amber-200/70">
            Cast: <strong className="text-amber-300">{stageActors.length} characters on stage</strong>
          </span>
        </div>

        <MultiCharacterStage
          actors={stageActors}
          isNarratorSpeaking={isNarrator}
          backgroundId={currentScene.backgroundId}
        />

        <DialogueBubble
          node={currentNode}
          activeSpeakerName={
            currentNode.speakerNameKey ? t(currentNode.speakerNameKey) : effectiveSpeaker
          }
          isNarrator={isNarrator}
          onSelectNode={handleSelectNode}
        />
      </CardContent>
    </Card>
  );
};
