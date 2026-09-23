import React from "react";
import { Sparkles, CheckCircle2, Zap } from "lucide-react";
import { MagicTriggerType } from "../../game/types";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, KbdKey } from "../ui";
import { SkillIcon } from "./SkillIcon";
import { SkillRestrictionsBox } from "./SkillRestrictionsBox";
import { useI18n } from "../../hooks/useI18n";
import { useSkills } from "../../hooks/useGame";

export interface SkillDetailsCardProps {
  className?: string;
}

export const SkillDetailsCard: React.FC<SkillDetailsCardProps> = ({ className = "" }) => {
  const { t } = useI18n();
  const {
    selectedNode,
    unlockSkill,
    assignSpell,
    primarySpellId,
    secondarySpellId,
    evaluateSkill,
  } = useSkills();

  if (!selectedNode) {
    return (
      <Card variant="subtle" className={`items-center justify-center p-8 text-stone-400 italic text-xs ${className}`}>
        {t("constellationInspectHint")}
      </Card>
    );
  }

  const skill = selectedNode.skill;
  const evalResult = evaluateSkill(selectedNode.id);
  const isUnlocked = evalResult.isUnlocked;
  const canUnlock = evalResult.canUnlock;

  const isPrimary = primarySpellId === skill.id;
  const isSecondary = secondarySpellId === skill.id;

  const handleUnlock = () => {
    unlockSkill(selectedNode.id);
  };

  const handleAssign = (slot: "primary" | "secondary") => {
    assignSpell(skill.id, slot);
  };

  return (
    <Card variant="highlight" className={`flex flex-col justify-between h-full bg-[#1c0c07] border-2 border-amber-600/60 shadow-xl ${className}`}>
      {/* Header Section */}
      <CardHeader className="pb-3 border-b border-[#3d1b0e]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-stone-950 rounded-2xl border-2 border-amber-500/50 shadow-md shadow-amber-950/40">
            <SkillIcon name={skill.iconName} size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg text-[#fbbf24] truncate">
              {t(skill.nameKey)}
            </CardTitle>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge variant="amber" className="text-[10px] font-bold">
                Tier {selectedNode.tier}
              </Badge>
              <Badge variant="purple" className="text-[10px]">
                {skill.triggerType === MagicTriggerType.Action
                  ? t("actionType")
                  : skill.triggerType === MagicTriggerType.Automatic
                  ? t("autoType")
                  : t("passiveType")}
              </Badge>
              {isPrimary && (
                <Badge variant="cyan" className="text-[10px]" icon={<CheckCircle2 size={10} />}>
                  {t("equippedPrimaryBadge")}
                </Badge>
              )}
              {isSecondary && (
                <Badge variant="amber" className="text-[10px]" icon={<CheckCircle2 size={10} />}>
                  {t("equippedSecondaryBadge")}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Main Content Body */}
      <CardContent className="gap-3 pt-3 flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-3">
          {/* Skill Narrative Description */}
          <p className="text-xs text-[#fed7aa] leading-relaxed bg-[#140704] p-3 rounded-xl border border-[#3d1b0e]">
            {t(skill.descriptionKey)}
          </p>

          {/* Spell Specific Properties Matrix */}
          <div className="bg-[#140704] rounded-xl p-2.5 border border-[#3d1b0e] flex flex-col gap-1.5 text-xs">
            {skill.manaCost > 0 && (
              <div className="flex justify-between text-cyan-300">
                <span>{t("manaCostLabel")}</span>
                <span className="font-mono font-bold">{skill.manaCost} PM</span>
              </div>
            )}
            {skill.damage > 0 && (
              <div className="flex justify-between text-amber-300">
                <span>{t("damageLabel")}</span>
                <span className="font-mono font-bold">+{skill.damage}</span>
              </div>
            )}
            {skill.cooldownFrames > 0 && (
              <div className="flex justify-between text-stone-400">
                <span>{t("cooldownLabel")}</span>
                <span className="font-mono font-bold">
                  {(skill.cooldownFrames / 60).toFixed(1)}s
                </span>
              </div>
            )}
            {skill.shieldDurationFrames && skill.shieldDurationFrames > 0 && (
              <div className="flex justify-between text-indigo-300">
                <span>Czas ochrony:</span>
                <span className="font-mono font-bold">
                  {(skill.shieldDurationFrames / 60).toFixed(1)}s
                </span>
              </div>
            )}
            {skill.autoIntervalFrames && skill.autoIntervalFrames > 0 && (
              <div className="flex justify-between text-yellow-300">
                <span>Częstotliwość aktywacji:</span>
                <span className="font-mono font-bold">
                  {(skill.autoIntervalFrames / 60).toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          {/* Requirements & Restrictions Box with I18N */}
          <SkillRestrictionsBox node={selectedNode} />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#3d1b0e]">
          {!isUnlocked ? (
            <Button
              id="unlock-skill-btn"
              fullWidth
              variant="primary"
              size="md"
              disabled={!canUnlock}
              icon={<Sparkles size={15} />}
              onClick={handleUnlock}
              className="py-2 text-xs font-bold"
            >
              {t("unlockSkill")} ({selectedNode.pointCost} PU)
            </Button>
          ) : (
            <>
              {skill.triggerType === MagicTriggerType.Action ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    id="equip-primary-spell-btn"
                    fullWidth
                    variant={isPrimary ? "primary" : "secondary"}
                    size="sm"
                    icon={<KbdKey variant="cyan">U</KbdKey>}
                    onClick={() => handleAssign("primary")}
                    className="text-xs"
                  >
                    {isPrimary ? "Aktywny [U]" : t("equipAsPrimary")}
                  </Button>

                  <Button
                    id="equip-secondary-spell-btn"
                    fullWidth
                    variant={isSecondary ? "primary" : "secondary"}
                    size="sm"
                    icon={<KbdKey variant="amber">I</KbdKey>}
                    onClick={() => handleAssign("secondary")}
                    className="text-xs"
                  >
                    {isSecondary ? "Aktywny [I]" : t("equipAsSecondary")}
                  </Button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-[#140704] border border-emerald-600/40 text-center text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2">
                  <Zap size={14} className="text-emerald-400" />
                  <span>
                    {skill.triggerType === MagicTriggerType.Passive
                      ? "Aura pasywna jest trwale aktywna na bohaterze."
                      : "Zaklęcie aktywuje się automatycznie podczas walki."}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillDetailsCard;
