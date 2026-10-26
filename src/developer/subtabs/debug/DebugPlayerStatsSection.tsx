import React from "react";
import { User, Zap, Heart, Compass } from "lucide-react";
import { Badge, ProgressBar, BarVariant, Text } from "@ui";
import { useI18n } from "@context/I18nContext";
import { DebugPlayerStatsSectionProps } from "./types";

interface VitalsRowProps {
  label: string;
  icon: React.ReactNode;
  current: number;
  max: number;
  variant: BarVariant;
}

const VitalsRow: React.FC<VitalsRowProps> = React.memo(function VitalsRow({
  label,
  icon,
  current,
  max,
  variant,
}) {
  const safeCurrent = Math.max(0, Math.round(current));
  const safeMax = Math.max(1, Math.round(max));

  return (
    <div className="flex flex-col gap-0.5">
      <Text as="div" family="mono" size="2xs" className="flex justify-between text-stone-400 select-none">
        <span className="flex items-center gap-1">
          {icon} {label}
        </span>
        <span>
          {safeCurrent} / {safeMax}
        </span>
      </Text>
      <ProgressBar
        value={safeCurrent}
        max={safeMax}
        variant={variant}
        heightClass="h-2"
      />
    </div>
  );
});

export const DebugPlayerStatsSection: React.FC<DebugPlayerStatsSectionProps> = React.memo(
  function DebugPlayerStatsSection({ player, playerNumber, label }) {
    const { t } = useI18n();

    const isGrounded = !!player.isGrounded;
    const isAttacking = !!player.isAttacking;
    const isDashing = !!player.isDashing;

    const posX = Number.isFinite(player.x) ? Math.round(player.x) : 0;
    const posY = Number.isFinite(player.y) ? Math.round(player.y) : 0;
    const velX = Number.isFinite(player.vx) ? player.vx.toFixed(1) : "0.0";
    const velY = Number.isFinite(player.vy) ? player.vy.toFixed(1) : "0.0";

    return (
      <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#140602] border border-stone-800">
        <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
          <Text as="div" weight="bold" size="xs" className="flex items-center gap-1.5 text-amber-300">
            <User size={14} className="text-amber-400" />
            <span>
              {label} (P{playerNumber})
            </span>
          </Text>
          <Badge variant={playerNumber === 1 ? "amber" : "cyan"}>
            {player.facingLeft ? t("debugPlayerFacingLeft") : t("debugPlayerFacingRight")}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex flex-col p-1.5 bg-black/40 rounded border border-stone-900">
            <span className="text-[10px] text-stone-500 select-none">{t("debugPlayerPos")}</span>
            <Text as="span" family="mono" weight="bold" className="text-amber-200">
              X: {posX}, Y: {posY}
            </Text>
          </div>
          <div className="flex flex-col p-1.5 bg-black/40 rounded border border-stone-900">
            <span className="text-[10px] text-stone-500 select-none">{t("debugPlayerVel")}</span>
            <Text as="span" family="mono" weight="bold" className="text-cyan-200">
              vx: {velX}, vy: {velY}
            </Text>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <span className="text-stone-400 select-none">{t("debugPlayerState")}:</span>
          <Text as="span" family="mono" weight="bold" className="px-1.5 py-0.5 rounded bg-black/60 border border-stone-800 text-stone-300">
            {player.animationState || t("debugPlayerIdleState")}
          </Text>
          <Text
            as="span"
            family="mono"
            size="2xs"
            weight="bold"
            className={`px-1.5 py-0.5 rounded border ${isGrounded
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
                : "bg-amber-950/60 text-amber-300 border-amber-700/60"
              }`}
          >
            {t("debugPlayerGrounded")}: {isGrounded ? t("debugYes") : t("debugNo")}
          </Text>
          {isAttacking && (
            <Text as="span" family="mono" size="2xs" weight="bold" className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-700/60">
              {t("debugPlayerAttack")}
            </Text>
          )}
          {isDashing && (
            <Text as="span" family="mono" size="2xs" weight="bold" className="px-1.5 py-0.5 rounded bg-yellow-950/60 text-yellow-300 border border-yellow-700/60">
              {t("debugPlayerDash")}
            </Text>
          )}
        </div>

        <div className="flex flex-col gap-1.5 pt-1">
          <VitalsRow
            label={t("debugVitalsHp")}
            icon={<Heart size={10} className="text-rose-400" />}
            current={player.health}
            max={player.maxHealth}
            variant="health"
          />
          <VitalsRow
            label={t("debugVitalsMp")}
            icon={<Zap size={10} className="text-cyan-400" />}
            current={player.mana}
            max={player.maxMana}
            variant="mana"
          />
          <VitalsRow
            label={t("debugVitalsSp")}
            icon={<Compass size={10} className="text-emerald-400" />}
            current={player.stamina}
            max={player.maxStamina}
            variant="stamina"
          />
        </div>
      </div>
    );
  }
);

DebugPlayerStatsSection.displayName = "DebugPlayerStatsSection";

export default DebugPlayerStatsSection;
