import React, { useState, useMemo, useCallback } from "react";
import {
  GitFork,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Text, Paragraph, IconText, MetaItem } from "@ui";
import { cn } from "@lib/utils";
import skillsJson from "@data/skills/skills.json";
import { calculateDagNodePositions, DagNodePosition } from "@lib/math/dagLayout";
import { SkillCharacter, SkillNodeJsonSchema, SkillsDictionaryJsonSchema } from "@lib/schemas/skillsSchema";
import { useI18n } from "@context/I18nContext";

export const SkillTreeVisualizerCard: React.FC = () => {
  const { t } = useI18n();
  const [selectedCharacter, setSelectedCharacter] = useState<SkillCharacter>("valen");
  const [inspectedSkillId, setInspectedSkillId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  const characterSkills: SkillNodeJsonSchema[] = useMemo(() => {
    const typedSkills = skillsJson as SkillsDictionaryJsonSchema;
    return typedSkills[selectedCharacter] ?? [];
  }, [selectedCharacter]);

  const layout = useMemo(() => {
    return calculateDagNodePositions(characterSkills, {
      nodeWidth: 140,
      nodeHeight: 65,
      horizontalSpacing: 40,
      verticalSpacing: 70,
      padding: 30,
    });
  }, [characterSkills]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, DagNodePosition>();
    layout.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [layout.nodes]);

  const inspectedSkill = useMemo(() => {
    return characterSkills.find((s) => s.id === inspectedSkillId);
  }, [characterSkills, inspectedSkillId]);

  const handleZoomIn = useCallback(() => {
    setZoomScale((prev) => Math.min(Number((prev + 0.2).toFixed(1)), 2.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomScale((prev) => Math.max(Number((prev - 0.2).toFixed(1)), 0.6));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomScale(1);
  }, []);

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<GitFork className="w-4 h-4 text-emerald-400" />}>
            {t("dataStudioSkillTreeCardTitle")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!layout.hasCycles ? (
              <Badge
                variant="green"
                icon={<CheckCircle2 size={13} />}
                role="status"
                aria-live="polite"
              >
                {t("dataStudioSkillTreeValid")} ({layout.nodes.length},{" "}
                {layout.edges.length})
              </Badge>
            ) : (
              <Badge
                variant="red"
                icon={<AlertOctagon size={13} />}
                role="alert"
                aria-live="polite"
              >
                {t("dataStudioSkillTreeCycleDetected")} ({layout.cycles.length})
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <Text as="span" size="xs" weight="medium" className="text-amber-200/80">
              {t("dataStudioSkillTreeCharacter")}
            </Text>
            <div className="flex gap-1.5">
              <Button
                variant={selectedCharacter === "valen" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setSelectedCharacter("valen");
                  setInspectedSkillId(null);
                }}
              >
                Valen
              </Button>
              <Button
                variant={selectedCharacter === "aurelia" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setSelectedCharacter("aurelia");
                  setInspectedSkillId(null);
                }}
              >
                Aurelia
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Text as="span" size="xs" family="mono" className="text-amber-300/80 px-2">
              {Math.round(zoomScale * 100)}%
            </Text>
            <Button
              variant="secondary"
              size="sm"
              icon={<ZoomOut size={13} />}
              onClick={handleZoomOut}
              disabled={zoomScale <= 0.6}
              title={t("dataStudioSkillTreeZoomOut")}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<ZoomIn size={13} />}
              onClick={handleZoomIn}
              disabled={zoomScale >= 2.0}
              title={t("dataStudioSkillTreeZoomIn")}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw size={13} />}
              onClick={handleResetZoom}
              title={t("dataStudioSkillTreeResetZoom")}
            />
          </div>
        </div>

        <div className="relative overflow-auto border border-amber-900/60 rounded-lg bg-stone-950 p-2 min-h-[360px] max-h-[560px] touch-pan-x touch-pan-y">
          <div
            style={{
              width: `${layout.width * zoomScale}px`,
              height: `${layout.height * zoomScale}px`,
              minWidth: "100%",
              transition: "width 0.15s ease, height 0.15s ease",
            }}
          >
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              style={{ width: "100%", height: "100%" }}
            >
              <defs>
                <marker
                  id="dag-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" className="fill-amber-500" />
                </marker>
              </defs>

              {layout.edges.map((edge) => {
                const from = nodeMap.get(edge.fromId);
                const to = nodeMap.get(edge.toId);
                if (!from || !to) return null;

                const startX = from.x + 70;
                const startY = from.y + 65;
                const endX = to.x + 70;
                const endY = to.y;
                const midY = (startY + endY) / 2;

                return (
                  <path
                    key={`${edge.fromId}->${edge.toId}`}
                    d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                    fill="none"
                    className="stroke-amber-600 stroke-2"
                    markerEnd="url(#dag-arrow)"
                  />
                );
              })}

              {layout.nodes.map((pos) => {
                const skill = characterSkills.find((s) => s.id === pos.id);
                const isSelected = inspectedSkillId === pos.id;

                return (
                  <g
                    key={pos.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer focus:outline-none"
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    onClick={() => setInspectedSkillId(pos.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setInspectedSkillId(pos.id);
                      }
                    }}
                  >
                    <rect
                      width="140"
                      height="65"
                      rx="6"
                      className={cn(
                        isSelected
                          ? "fill-amber-950 stroke-amber-500 stroke-2"
                          : "fill-stone-950 stroke-amber-900 stroke-1"
                      )}
                    />
                    <text
                      x="10"
                      y="22"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                      className="select-none fill-amber-200"
                    >
                      {skill?.nameKey ? t(skill.nameKey).slice(0, 15) : pos.id.slice(0, 15)}
                    </text>
                    <text
                      x="10"
                      y="38"
                      fontSize="9.5"
                      fontFamily="monospace"
                      className="select-none fill-amber-500"
                    >
                      {t("dataStudioSkillTreeTier")} {pos.tier} • {skill?.pointCost ?? 1} SP
                    </text>
                    <text
                      x="10"
                      y="52"
                      fontSize="9"
                      fontFamily="monospace"
                      className="select-none fill-stone-400"
                    >
                      {skill?.category ?? "active"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {inspectedSkill && (
          <Card
            variant="subtle"
            role="region"
            aria-live="polite"
            className="p-3 text-xs flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-1">
              <IconText
                icon={<Sparkles size={13} className="text-amber-400 shrink-0" />}
                weight="semibold"
                className="text-amber-300"
              >
                {t(inspectedSkill.nameKey)} ({inspectedSkill.id})
              </IconText>
              <Text as="span" family="mono" className="text-amber-400">
                {t("dataStudioSkillTreeTier")} {inspectedSkill.tier} | {t("dataStudioSkillTreeCost")}:{" "}
                {inspectedSkill.pointCost} SP
              </Text>
            </div>
            <Paragraph size="xs" variant="amber" italic className="text-amber-100/80">
              {t(inspectedSkill.descKey)}
            </Paragraph>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-amber-900/40">
              <MetaItem label={t("dataStudioSkillTreeMana")} value={inspectedSkill.manaCost} size="2xs" />
              <MetaItem label={t("dataStudioSkillTreeStamina")} value={inspectedSkill.staminaCost} size="2xs" />
              <MetaItem label={t("dataStudioSkillTreeDamage")} value={inspectedSkill.damage} size="2xs" />
              <MetaItem
                label={t("dataStudioSkillTreeRequires")}
                value={inspectedSkill.reqSkillId ?? t("dataStudioSkillTreeRequiresNone")}
                size="2xs"
              />
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
