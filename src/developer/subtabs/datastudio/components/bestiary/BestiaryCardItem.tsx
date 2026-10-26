import React from "react";
import { Heart, Swords, Zap, Sparkles } from "lucide-react";
import { Card, Badge, Heading, Text, IconText } from "@ui";
import { EnemyJsonSchema } from "@lib/schemas/enemySchema";
import { cn } from "@lib/utils";

export interface BestiaryCardItemProps {
  enemy: EnemyJsonSchema;
  isSelected: boolean;
  onSelect: (enemy: EnemyJsonSchema) => void;
}

export const BestiaryCardItem: React.FC<BestiaryCardItemProps> = React.memo(
  ({ enemy, isSelected, onSelect }) => {
    const bodyColor = enemy.proceduralFallback?.bodyColor;
    const accentColor = enemy.proceduralFallback?.accentColor;
    const eyesColor = enemy.proceduralFallback?.eyesColor;

    const width = enemy.dimensions?.width ?? 32;
    const height = enemy.dimensions?.height ?? 32;

    const getCategoryVariant = (): "red" | "amber" | "cyan" | "stone" | "purple" => {
      if (enemy.category === "boss") return "red";
      if (enemy.category === "beast") return "amber";
      if (enemy.isAerial) return "cyan";
      if (enemy.isDummy) return "stone";
      return "purple";
    };

    return (
      <Card
        variant={isSelected ? "highlight" : "dark"}
        interactive
        role="button"
        aria-pressed={isSelected}
        tabIndex={0}
        onClick={() => onSelect(enemy)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(enemy);
          }
        }}
        className="flex flex-col text-left p-3 relative overflow-hidden group select-none"
      >
        <div className="flex items-start justify-between gap-2 mb-2 w-full">
          <div className="min-w-0 flex-1">
            <Heading level={4} size="sm" className="truncate group-hover:text-amber-200 transition-colors">
              {enemy.defaultName}
            </Heading>
            <Text as="span" family="mono" size="3xs" className="text-stone-400 truncate block">
              {enemy.id}
            </Text>
          </div>
          <Badge variant={getCategoryVariant()}>
            {enemy.category}
          </Badge>
        </div>

        <div className="h-24 w-full bg-stone-900/90 rounded-lg flex items-center justify-center p-2 mb-2.5 border border-stone-800/60 relative overflow-hidden">
          <div
            className={cn(
              "rounded transition-transform group-hover:scale-105 duration-200 relative flex items-center justify-center shadow-md",
              !bodyColor && "bg-rose-700 border-2 border-rose-500"
            )}
            style={{
              width: `${Math.min(width * 1.2, 70)}px`,
              height: `${Math.min(height * 1.2, 70)}px`,
              ...(bodyColor ? { backgroundColor: bodyColor, border: `2px solid ${accentColor ?? bodyColor}` } : {}),
            }}
          >
            <div className="flex gap-1">
              <div
                className={cn("w-1.5 h-1.5 rounded-full", !eyesColor && "bg-amber-300")}
                style={eyesColor ? { backgroundColor: eyesColor } : undefined}
              />
              <div
                className={cn("w-1.5 h-1.5 rounded-full", !eyesColor && "bg-amber-300")}
                style={eyesColor ? { backgroundColor: eyesColor } : undefined}
              />
            </div>

            {enemy.isAerial && (
              <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-cyan-600 text-white rounded-full px-1 py-0.2 leading-tight">
                ✈
              </span>
            )}
          </div>

          <Text as="div" family="mono" size="3xs" className="absolute bottom-1 right-1.5 text-stone-400">
            {width}x{height}
          </Text>
        </div>

        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-stone-800/70 text-xs w-full">
          <IconText
            icon={<Heart className="w-3 h-3 shrink-0" />}
            size="2xs"
            weight="semibold"
            variant="danger"
            className="truncate"
            title="Health"
          >
            {enemy.stats?.health ?? 0}
          </IconText>

          <IconText
            icon={<Swords className="w-3 h-3 shrink-0" />}
            size="2xs"
            weight="semibold"
            variant="amber"
            className="truncate"
            title="Attack Power"
          >
            {enemy.stats?.attackPower ?? 0}
          </IconText>

          <IconText
            icon={<Zap className="w-3 h-3 shrink-0" />}
            size="2xs"
            weight="semibold"
            variant="info"
            className="truncate"
            title="Speed"
          >
            {enemy.stats?.speed ?? 0}
          </IconText>
        </div>

        {enemy.soulDrop && (
          <div className="mt-2 flex items-center justify-between text-2xs text-purple-300 bg-purple-950/30 px-2 py-0.5 rounded border border-purple-800/40">
            <IconText
              icon={<Sparkles className="w-2.5 h-2.5" />}
              size="2xs"
              className="text-purple-300"
            >
              {enemy.soulDrop.type}
            </IconText>
            <Text as="span" family="mono" size="3xs" className="text-stone-400">
              {Math.round(enemy.soulDrop.dropRate * 100)}%
            </Text>
          </div>
        )}
      </Card>
    );
  }
);
BestiaryCardItem.displayName = "BestiaryCardItem";
