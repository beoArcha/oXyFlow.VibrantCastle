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
import { Card, CardHeader, CardTitle, CardContent, Button } from "@ui";
import skillsJson from "@data/skills/skills.json";
import { calculateDagNodePositions, DagNodePosition } from "@lib/math/dagLayout";
import { SkillCharacter, SkillNodeJsonSchema } from "@lib/schemas/skillsSchema";
import { useI18n } from "@context/I18nContext";

export const SkillTreeVisualizerCard: React.FC = () => {
  const { t } = useI18n();
  const [selectedCharacter, setSelectedCharacter] = useState<SkillCharacter>("valen");
  const [inspectedSkillId, setInspectedSkillId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  const characterSkills: SkillNodeJsonSchema[] = useMemo(() => {
    return (skillsJson as any)[selectedCharacter] ?? [];
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
              <span
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-md shadow-sm"
              >
                <CheckCircle2 size={13} />
                <span>
                  {t("dataStudioSkillTreeValid")} ({layout.nodes.length},{" "}
                  {layout.edges.length})
                </span>
              </span>
            ) : (
              <span
                role="alert"
                aria-live="polite"
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-700/50 px-2.5 py-1 rounded-md shadow-sm"
              >
                <AlertOctagon size={13} />
                <span>
                  {t("dataStudioSkillTreeCycleDetected")} ({layout.cycles.length})
                </span>
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Character Selector & Zoom Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-stone-950/60 border border-stone-800/80 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-amber-200/80">
              {t("dataStudioSkillTreeCharacter")}
            </span>
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

          {/* Responsive Zoom Controls */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="text-xs font-mono text-amber-300/80 px-2">
              {Math.round(zoomScale * 100)}%
            </span>
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

        {/* Visual Graph Canvas (Responsive Scroll Container) */}
        <div className="relative overflow-auto border border-amber-900/60 rounded-lg bg-[#0e0402] p-2 min-h-[360px] max-h-[560px] touch-pan-x touch-pan-y">
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
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
                </marker>
              </defs>

              {/* Connecting Edges */}
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
                    stroke="#b45309"
                    strokeWidth="2"
                    markerEnd="url(#dag-arrow)"
                  />
                );
              })}

              {/* Render Nodes */}
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
                      fill={isSelected ? "#3b160b" : "#1a0803"}
                      stroke={isSelected ? "#f59e0b" : "#78350f"}
                      strokeWidth={isSelected ? "2" : "1"}
                    />
                    <text
                      x="10"
                      y="22"
                      fill="#fde68a"
                      fontSize="11"
                      fontWeight="bold"
                      className="select-none font-sans"
                    >
                      {skill?.nameKey ? t(skill.nameKey).slice(0, 15) : pos.id.slice(0, 15)}
                    </text>
                    <text
                      x="10"
                      y="38"
                      fill="#ca8a04"
                      fontSize="9.5"
                      className="select-none font-mono"
                    >
                      {t("dataStudioSkillTreeTier")} {pos.tier} • {skill?.pointCost ?? 1} SP
                    </text>
                    <text
                      x="10"
                      y="52"
                      fill="#a8a29e"
                      fontSize="9"
                      className="select-none font-mono"
                    >
                      {skill?.category ?? "active"}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Inspected Node Details */}
        {inspectedSkill && (
          <div
            role="region"
            aria-live="polite"
            className="bg-[#140602] border border-amber-800/60 rounded-lg p-3 text-xs flex flex-col gap-2 shadow-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400 shrink-0" />
                {t(inspectedSkill.nameKey)} ({inspectedSkill.id})
              </span>
              <span className="text-amber-400 font-mono">
                {t("dataStudioSkillTreeTier")} {inspectedSkill.tier} | {t("dataStudioSkillTreeCost")}:{" "}
                {inspectedSkill.pointCost} SP
              </span>
            </div>
            <p className="text-amber-100/80 italic">{t(inspectedSkill.descKey)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-amber-900/40 text-[11px] text-amber-200/70">
              <div>
                {t("dataStudioSkillTreeMana")}: {inspectedSkill.manaCost}
              </div>
              <div>
                {t("dataStudioSkillTreeStamina")}: {inspectedSkill.staminaCost}
              </div>
              <div>
                {t("dataStudioSkillTreeDamage")}: {inspectedSkill.damage}
              </div>
              <div>
                {t("dataStudioSkillTreeRequires")}:{" "}
                {inspectedSkill.reqSkillId ?? t("dataStudioSkillTreeRequiresNone")}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
