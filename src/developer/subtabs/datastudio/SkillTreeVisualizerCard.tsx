import React, { useState, useMemo } from "react";
import { GitFork, CheckCircle2, AlertOctagon, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@ui";
import skillsJson from "@data/skills/skills.json";
import { calculateDagNodePositions, DagNodePosition } from "@lib/math/dagLayout";
import { SkillCharacter, SkillNodeJsonSchema } from "@lib/schemas/skillsSchema";
import { useI18n } from "@context/I18nContext";

export const SkillTreeVisualizerCard: React.FC = () => {
  const { t } = useI18n();
  const [selectedCharacter, setSelectedCharacter] = useState<SkillCharacter>("valen");
  const [inspectedSkillId, setInspectedSkillId] = useState<string | null>(null);

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

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle icon={<GitFork className="w-4 h-4 text-emerald-400" />}>
            Skill Tree Progression Graph (DAG Visualizer)
          </CardTitle>
          <div className="flex items-center gap-2">
            {!layout.hasCycles ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded">
                <CheckCircle2 size={13} /> Valid DAG ({layout.nodes.length} nodes, {layout.edges.length} edges)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-950/60 border border-rose-700/50 px-2 py-0.5 rounded">
                <AlertOctagon size={13} /> Cycle Detected ({layout.cycles.length})
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Character Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-amber-200/80">Skill Tree Character:</label>
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

        {/* Visual Graph Canvas */}
        <div className="relative overflow-auto border border-amber-900/60 rounded-lg bg-[#0e0402] p-2 min-h-[380px]">
          <svg
            className="w-full h-full min-w-[640px]"
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            style={{ width: `${layout.width}px`, height: `${layout.height}px` }}
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
                  className="cursor-pointer"
                  onClick={() => setInspectedSkillId(pos.id)}
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
                    Tier {pos.tier} • {skill?.pointCost ?? 1} SP
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

        {/* Inspected Node Drawer */}
        {inspectedSkill && (
          <div className="bg-[#140602] border border-amber-800/60 rounded-lg p-3 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                {t(inspectedSkill.nameKey)} ({inspectedSkill.id})
              </span>
              <span className="text-amber-400 font-mono">
                Tier {inspectedSkill.tier} | Cost: {inspectedSkill.pointCost} SP
              </span>
            </div>
            <p className="text-amber-100/80 italic">{t(inspectedSkill.descKey)}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-amber-900/40 text-[11px] text-amber-200/70">
              <div>Mana: {inspectedSkill.manaCost}</div>
              <div>Stamina: {inspectedSkill.staminaCost}</div>
              <div>Damage: {inspectedSkill.damage}</div>
              <div>Requires: {inspectedSkill.reqSkillId ?? "None"}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
