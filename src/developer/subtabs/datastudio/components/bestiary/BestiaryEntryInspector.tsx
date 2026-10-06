import React from "react";
import {
  Skull,
  Heart,
  Swords,
  Zap,
  Sparkles,
  Shield,
  Edit3,
  Award,
  BookOpen,
} from "lucide-react";
import {
  Card,
  Badge,
  Button,
  EmptyState,
  StatRow,
  ProgressBar,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { EnemyJsonSchema } from "@lib/schemas/enemySchema";
import { cn } from "@lib/utils";

export interface BestiaryEntryInspectorProps {
  enemy: EnemyJsonSchema | null;
  onOpenInEditor?: (enemy: EnemyJsonSchema) => void;
  className?: string;
}

export const BestiaryEntryInspector: React.FC<BestiaryEntryInspectorProps> = React.memo(
  ({ enemy, onOpenInEditor, className }) => {
    const { t } = useI18n();

    if (!enemy) {
      return (
        <Card
          variant="panel"
          className={cn(
            "p-6 flex items-center justify-center min-h-[350px]",
            className
          )}
        >
          <EmptyState
            icon={<Skull className="w-8 h-8 text-stone-600" />}
            title="Wybierz potwora"
            description="Kliknij na dowolnego wroga z listy po lewej, aby podejrzeć jego statystyki, hitboxy i zrzut duszy."
          />
        </Card>
      );
    }

    const bodyColor = enemy.proceduralFallback?.bodyColor;
    const accentColor = enemy.proceduralFallback?.accentColor;
    const eyesColor = enemy.proceduralFallback?.eyesColor;

    const width = enemy.dimensions?.width ?? 32;
    const height = enemy.dimensions?.height ?? 32;

    const maxHpReference = 1000;
    const hpProgress = Math.min((enemy.stats?.health ?? 0), maxHpReference);

    return (
      <Card
        variant="panel"
        className={cn(
          "flex flex-col gap-4 p-4 text-left",
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-800/70 pb-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-stone-100 truncate">
                {enemy.defaultName}
              </h3>
              <Badge
                variant={
                  enemy.category === "boss"
                    ? "red"
                    : enemy.category === "beast"
                    ? "amber"
                    : "purple"
                }
              >
                {enemy.category}
              </Badge>
              {enemy.isAerial && (
                <Badge variant="cyan">
                  {t("dataStudioBestiaryFilterAerialOnly")}
                </Badge>
              )}
              {enemy.isDummy && (
                <Badge variant="stone">
                  Dummy
                </Badge>
              )}
            </div>
            <span className="text-xs font-mono text-stone-400">
              ID: {enemy.id} ({enemy.nameKey})
            </span>
          </div>

          {onOpenInEditor && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => onOpenInEditor(enemy)}
              className="shrink-0"
            >
              {t("dataStudioBestiaryOpenInEditor")}
            </Button>
          )}
        </div>

        <Card variant="subtle" className="flex flex-col sm:flex-row items-center gap-4 p-3">
          <div className="w-32 h-32 bg-stone-950/90 rounded-lg flex items-center justify-center p-2 border border-stone-800 relative overflow-hidden shrink-0">
            <div
              className={cn(
                "rounded relative flex items-center justify-center shadow-lg transition-transform duration-300",
                !bodyColor && "bg-rose-700 border-2 border-rose-500"
              )}
              style={{
                width: `${Math.min(width * 1.5, 100)}px`,
                height: `${Math.min(height * 1.5, 100)}px`,
                ...(bodyColor ? { backgroundColor: bodyColor, border: `3px solid ${accentColor ?? bodyColor}` } : {}),
              }}
            >
              <div className="flex gap-1.5">
                <div
                  className={cn("w-2 h-2 rounded-full shadow", !eyesColor && "bg-amber-300")}
                  style={eyesColor ? { backgroundColor: eyesColor } : undefined}
                />
                <div
                  className={cn("w-2 h-2 rounded-full shadow", !eyesColor && "bg-amber-300")}
                  style={eyesColor ? { backgroundColor: eyesColor } : undefined}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 w-full text-xs">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              {t("dataStudioBestiaryDimensions")}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-stone-950/50 rounded border border-stone-800/60">
                <span className="text-stone-400 block text-[10px]">
                  {t("dataStudioEnemyWidth")}
                </span>
                <span className="font-mono font-bold text-stone-200">
                  {width} px
                </span>
              </div>
              <div className="p-2 bg-stone-950/50 rounded border border-stone-800/60">
                <span className="text-stone-400 block text-[10px]">
                  {t("dataStudioEnemyHeight")}
                </span>
                <span className="font-mono font-bold text-stone-200">
                  {height} px
                </span>
              </div>
            </div>

            {bodyColor && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-stone-400">Palette:</span>
                <div
                  className="w-4 h-4 rounded-full border border-stone-700 shadow-sm"
                  style={{ backgroundColor: bodyColor }}
                  title={`Body Color: ${bodyColor}`}
                />
                {accentColor && (
                  <div
                    className="w-4 h-4 rounded-full border border-stone-700 shadow-sm"
                    style={{ backgroundColor: accentColor }}
                    title={`Accent Color: ${accentColor}`}
                  />
                )}
                {eyesColor && (
                  <div
                    className="w-4 h-4 rounded-full border border-stone-700 shadow-sm"
                    style={{ backgroundColor: eyesColor }}
                    title={`Eyes Color: ${eyesColor}`}
                  />
                )}
              </div>
            )}
          </div>
        </Card>

        <Card variant="subtle" className="flex flex-col gap-2.5 p-3">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Parametry Bojowe
          </span>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 text-rose-300">
                <Heart className="w-3.5 h-3.5" />
                <span>{t("dataStudioEnemyHealth")}:</span>
              </span>
              <span className="font-mono font-bold text-stone-100">
                {enemy.stats?.health ?? 0} / {enemy.stats?.maxHealth ?? enemy.stats?.health ?? 0}
              </span>
            </div>
            <ProgressBar
              value={hpProgress}
              max={maxHpReference}
              variant="danger"
              size="sm"
              showValueText={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <StatRow
              label={t("dataStudioEnemyAttackPower")}
              value={enemy.stats?.attackPower ?? 0}
              icon={<Swords className="w-3.5 h-3.5 text-amber-400" />}
              variant="amber"
            />
            <StatRow
              label={t("dataStudioEnemySpeed")}
              value={enemy.stats?.speed ?? 0}
              icon={<Zap className="w-3.5 h-3.5 text-cyan-400" />}
              variant="cyan"
            />
            <StatRow
              label={t("dataStudioBestiaryScoreReward")}
              value={enemy.stats?.scoreReward ?? 0}
              icon={<Award className="w-3.5 h-3.5 text-yellow-400" />}
              variant="default"
            />
            {enemy.stats?.defense !== undefined && (
              <StatRow
                label="Obrona"
                value={enemy.stats.defense}
                icon={<Shield className="w-3.5 h-3.5 text-blue-400" />}
                variant="default"
              />
            )}
          </div>
        </Card>

        {enemy.elementalResistances && (
          <Card variant="subtle" className="flex flex-col gap-2 p-3">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              {t("dataStudioBestiaryResistances")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(enemy.elementalResistances).map(
                ([element, val]) => {
                  const percent = Math.round(val * 100);
                  const isResistant = val > 0;
                  const isWeak = val < 0;

                  return (
                    <Badge
                      key={element}
                      variant={isResistant ? "green" : isWeak ? "red" : "stone"}
                    >
                      <span className="capitalize">{element}:</span>
                      <span className="font-mono font-bold">
                        {percent > 0 ? `+${percent}%` : `${percent}%`}
                      </span>
                    </Badge>
                  );
                }
              )}
            </div>
          </Card>
        )}

        {enemy.soulDrop && (
          <Card variant="dark" className="flex flex-col gap-2 p-3 border-purple-800/50">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {t("dataStudioBestiarySoulDrop")}
              </span>
              <Badge variant="purple">
                {enemy.soulDrop.type}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-stone-400 text-[10px]">
                  {t("dataStudioBestiaryDropRate")}:
                </span>
                <span className="font-mono font-bold text-stone-200">
                  {Math.round(enemy.soulDrop.dropRate * 100)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-stone-400 text-[10px]">
                  Skill ID:
                </span>
                <span className="font-mono font-bold text-purple-200 truncate">
                  {enemy.soulDrop.grantedSkillId}
                </span>
              </div>
            </div>
          </Card>
        )}

        {enemy.bestiary && (
          <Card variant="dark" className="flex flex-col gap-2 p-3 text-xs">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {t("dataStudioBestiaryLoreQuote")}
            </span>
            <div className="flex flex-col gap-1 text-stone-300 font-mono text-[11px]">
              <div>
                <span className="text-stone-400">Bestiary Key: </span>
                <span>{enemy.bestiary.bestiaryKey}</span>
              </div>
              <div>
                <span className="text-stone-400">Tactics Key: </span>
                <span>{enemy.bestiary.tacticsKey}</span>
              </div>
              <div>
                <span className="text-stone-400">Lore Key: </span>
                <span>{enemy.bestiary.loreQuoteKey}</span>
              </div>
            </div>
          </Card>
        )}
      </Card>
    );
  }
);
BestiaryEntryInspector.displayName = "BestiaryEntryInspector";
