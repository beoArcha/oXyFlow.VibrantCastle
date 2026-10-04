import React, { useMemo } from "react";
import { Sparkles, CheckCircle2, Zap } from "lucide-react";
import { toSkillDetailVM, SkillDetailVM } from "@components/adapters";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, KbdKey, Alert } from "../ui";
import { SkillIcon } from "./SkillIcon";
import { SkillPropertyMatrix } from "./SkillPropertyMatrix";
import { SkillRestrictionsBox } from "./SkillRestrictionsBox";
import { useI18n } from "@context/I18nContext";
import { useSkills } from "@context/GameContext";

export interface SkillDetailsCardProps {
  readonly className?: string;
  readonly primaryKey?: string;
  readonly secondaryKey?: string;
  readonly detail?: SkillDetailVM | null;
}

export const SkillDetailsCard = ({
  className = "",
  primaryKey = "U",
  secondaryKey = "I",
  detail,
}: SkillDetailsCardProps): React.ReactElement => {
  const { t } = useI18n();
  const {
    selectedNode,
    unlockSkill,
    assignSpell,
    primarySpellId,
    secondarySpellId,
    evaluateSkill,
    skillPoints,
  } = useSkills();

  const detailVM = useMemo(() => {
    if (detail !== undefined) return detail;
    if (!selectedNode) return null;
    return toSkillDetailVM(
      selectedNode,
      evaluateSkill(selectedNode.id),
      skillPoints,
      primarySpellId === selectedNode.id,
      secondarySpellId === selectedNode.id,
      t("manaUnit")
    );
  }, [detail, selectedNode, evaluateSkill, skillPoints, primarySpellId, secondarySpellId, t]);

  if (!detailVM) {
    return (
      <Card variant="subtle" className={`items-center justify-center p-8 text-stone-400 italic text-xs ${className}`}>
        {t("constellationInspectHint")}
      </Card>
    );
  }

  const handleUnlock = () => {
    unlockSkill(detailVM.id);
  };

  const handleAssign = (slot: "primary" | "secondary") => {
    assignSpell(detailVM.id, slot);
  };

  return (
    <Card variant="highlight" className={`flex flex-col justify-between h-full bg-[#1c0c07] border-2 border-amber-600/60 shadow-xl ${className}`}>
      <CardHeader className="pb-3 border-b border-[#3d1b0e]">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-stone-950 rounded-2xl border-2 border-amber-500/50 shadow-md shadow-amber-950/40">
            <SkillIcon name={detailVM.iconName} size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg text-[#fbbf24] truncate">
              {t(detailVM.nameKey)}
            </CardTitle>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge variant="amber" className="text-[10px] font-bold">
                Tier {detailVM.tier}
              </Badge>
              <Badge variant="purple" className="text-[10px]">
                {detailVM.isAction
                  ? t("actionType")
                  : detailVM.isAuto
                  ? t("autoType")
                  : t("passiveType")}
              </Badge>
              {detailVM.isPrimary && (
                <Badge variant="cyan" className="text-[10px]" icon={<CheckCircle2 size={10} />}>
                  {t("equippedPrimaryBadge")}
                </Badge>
              )}
              {detailVM.isSecondary && (
                <Badge variant="amber" className="text-[10px]" icon={<CheckCircle2 size={10} />}>
                  {t("equippedSecondaryBadge")}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="gap-3 pt-3 flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-3">
          <Card variant="dark" className="p-3 text-xs text-[#fed7aa] leading-relaxed">
            {t(detailVM.descriptionKey)}
          </Card>

          <SkillPropertyMatrix properties={detailVM.properties} />

          <SkillRestrictionsBox restriction={detailVM.restriction} />
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-[#3d1b0e]">
          {!detailVM.isUnlocked ? (
            <Button
              id="unlock-skill-btn"
              fullWidth
              variant="primary"
              size="md"
              disabled={!detailVM.canUnlock}
              icon={<Sparkles size={15} />}
              onClick={handleUnlock}
              className="py-2 text-xs font-bold"
            >
              {t("unlockSkill")} ({detailVM.pointCost} {t("skillPointsUnit")})
            </Button>
          ) : (
            <>
              {detailVM.isAction ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    id="equip-primary-spell-btn"
                    fullWidth
                    variant={detailVM.isPrimary ? "primary" : "secondary"}
                    size="sm"
                    icon={<KbdKey variant="cyan">{primaryKey}</KbdKey>}
                    onClick={() => handleAssign("primary")}
                    className="text-xs"
                  >
                    {detailVM.isPrimary ? `${t("equippedActiveSlot")} [${primaryKey}]` : t("equipAsPrimary")}
                  </Button>

                  <Button
                    id="equip-secondary-spell-btn"
                    fullWidth
                    variant={detailVM.isSecondary ? "primary" : "secondary"}
                    size="sm"
                    icon={<KbdKey variant="amber">{secondaryKey}</KbdKey>}
                    onClick={() => handleAssign("secondary")}
                    className="text-xs"
                  >
                    {detailVM.isSecondary ? `${t("equippedActiveSlot")} [${secondaryKey}]` : t("equipAsSecondary")}
                  </Button>
                </div>
              ) : (
                <Alert
                  variant="success"
                  icon={<Zap size={14} className="text-emerald-400" />}
                  className="p-2.5 justify-center text-center font-semibold"
                >
                  {detailVM.isPassive
                    ? t("passivePermanentDesc")
                    : t("autoCastDesc")}
                </Alert>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillDetailsCard;
