import React from "react";
import { User, Shield, Zap, Heart, Compass } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, Badge, ProgressBar } from "../../../ui";
import { Player } from "../../../../game/types";
import { useI18n } from "../../../../hooks/useI18n";

export interface DebugPlayerInspectorProps {
  p1: Player | null;
  p2: Player | null;
  isTwoPlayer: boolean;
}

export const DebugPlayerInspectorCard: React.FC<DebugPlayerInspectorProps> = ({
  p1,
  p2,
  isTwoPlayer,
}) => {
  const { t } = useI18n();

  const renderPlayerStats = (player: Player, playerNumber: number, label: string) => {
    const isGrounded = player.isGrounded;
    const isAttacking = !!player.isAttacking;
    const isDashing = !!player.isDashing;

    return (
      <div
        key={player.id}
        className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#140602] border border-stone-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
            <User size={14} className="text-amber-400" />
            <span>
              {label} (P{playerNumber})
            </span>
          </div>
          <Badge variant={playerNumber === 1 ? "amber" : "cyan"}>
            {player.facingLeft ? t("debugPlayerFacingLeft") : t("debugPlayerFacingRight")}
          </Badge>
        </div>

        {/* Position & Kinematics */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="flex flex-col p-1.5 bg-black/40 rounded border border-stone-900">
            <span className="text-[10px] text-stone-500">{t("debugPlayerPos")}</span>
            <span className="text-amber-200 font-bold">
              X: {Math.round(player.x)}, Y: {Math.round(player.y)}
            </span>
          </div>
          <div className="flex flex-col p-1.5 bg-black/40 rounded border border-stone-900">
            <span className="text-[10px] text-stone-500">{t("debugPlayerVel")}</span>
            <span className="text-cyan-200 font-bold">
              vx: {player.vx.toFixed(1)}, vy: {player.vy.toFixed(1)}
            </span>
          </div>
        </div>

        {/* State Flags */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
          <span className="text-stone-400">{t("debugPlayerState")}:</span>
          <span className="px-1.5 py-0.5 rounded bg-black/60 border border-stone-800 text-stone-300 font-bold">
            {player.animationState || "idle"}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
              isGrounded
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
                : "bg-amber-950/60 text-amber-300 border-amber-700/60"
            }`}
          >
            {t("debugPlayerGrounded")}: {isGrounded ? t("debugYes") : t("debugNo")}
          </span>
          {isAttacking && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-700/60">
              {t("debugPlayerAttack")}
            </span>
          )}
          {isDashing && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-950/60 text-yellow-300 border border-yellow-700/60">
              {t("debugPlayerDash")}
            </span>
          )}
        </div>

        {/* Vitals Bars */}
        <div className="flex flex-col gap-1.5 pt-1">
          {/* Health */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[10px] font-mono text-stone-400">
              <span className="flex items-center gap-1">
                <Heart size={10} className="text-rose-400" /> HP
              </span>
              <span>
                {Math.round(player.health)} / {player.maxHealth}
              </span>
            </div>
            <ProgressBar
              value={player.health}
              max={player.maxHealth}
              variant="health"
              heightClass="h-2"
            />
          </div>

          {/* Mana */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[10px] font-mono text-stone-400">
              <span className="flex items-center gap-1">
                <Zap size={10} className="text-cyan-400" /> MP
              </span>
              <span>
                {Math.round(player.mana)} / {player.maxMana}
              </span>
            </div>
            <ProgressBar
              value={player.mana}
              max={player.maxMana}
              variant="mana"
              heightClass="h-2"
            />
          </div>

          {/* Stamina */}
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[10px] font-mono text-stone-400">
              <span className="flex items-center gap-1">
                <Compass size={10} className="text-emerald-400" /> SP
              </span>
              <span>
                {Math.round(player.stamina)} / {player.maxStamina}
              </span>
            </div>
            <ProgressBar
              value={player.stamina}
              max={player.maxStamina}
              variant="stamina"
              heightClass="h-2"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle icon={<Shield className="w-4 h-4 text-amber-400" />}>
          {t("debugPlayerInspectorTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {p1 && renderPlayerStats(p1, 1, t("p1Tag"))}
        {isTwoPlayer && p2 && renderPlayerStats(p2, 2, t("p2Tag"))}
      </CardContent>
    </Card>
  );
};

export default DebugPlayerInspectorCard;
