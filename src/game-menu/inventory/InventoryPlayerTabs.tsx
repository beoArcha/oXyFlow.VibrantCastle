import React from "react";
import { User } from "lucide-react";
import { CharacterPortrait } from "../character";
import { Tabs, TabsList, TabsTrigger, Badge, Text, Code } from "@ui";
import { PLAYER_THEMES } from "@styles/theme";
import { cn } from "@lib/utils";

export interface CharacterIdentityData {
  readonly characterId?: string;
  readonly characterName?: string;
}

export interface InventoryPlayerTabsProps {
  readonly p1?: CharacterIdentityData | null;
  readonly p2?: CharacterIdentityData | null;
  readonly isTwoPlayer: boolean;
  readonly activePlayerIndex: number;
  readonly onSelectPlayer: (index: number) => void;
  readonly p1Name: string;
  readonly p2Name: string;
}

/**
 * Presentational player switcher leveraging Design System Tabs and Badge controls.
 */
export const InventoryPlayerTabs = React.memo(function InventoryPlayerTabs({
  p1,
  p2,
  isTwoPlayer,
  activePlayerIndex,
  onSelectPlayer,
  p1Name,
  p2Name,
}: InventoryPlayerTabsProps) {
  if (!isTwoPlayer || !p2) {
    return (
      <Badge
        variant="amber"
        icon={<User size={14} className="text-amber-400" />}
        className="px-3 py-1.5 text-xs rounded-xl"
      >
        <Text weight="bold" size="xs" uppercase className="tracking-wide text-inherit">
          {p1Name}
        </Text>
      </Badge>
    );
  }

  const p1CharacterId = p1?.characterId || "valen";
  const p2CharacterId = p2?.characterId || "aurelia";

  return (
    <Tabs
      value={String(activePlayerIndex)}
      onValueChange={(val) => onSelectPlayer(Number(val))}
    >
      <TabsList className="bg-stone-950/80 p-1 rounded-xl border border-stone-800">
        <TabsTrigger
          value="0"
          icon={
            <div
              className={cn(
                "w-5 h-5 rounded overflow-hidden border bg-black/60 shrink-0",
                PLAYER_THEMES.crimson.avatarBorder
              )}
            >
              <CharacterPortrait characterId={p1CharacterId} className="w-full h-full" />
            </div>
          }
          className={cn(
            "gap-2 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none",
            activePlayerIndex === 0
              ? "bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-red-200 border-red-500/60 shadow-md shadow-red-950/50"
              : "bg-black/40 text-stone-400 hover:text-red-300 hover:bg-stone-900/60 border-stone-800/80 hover:border-red-900/40"
          )}
        >
          <span className="flex items-center gap-1.5">
            <Text weight="bold" size="xs" className="text-inherit">{p1Name}</Text>
            <Badge
              variant={activePlayerIndex === 0 ? "red" : "stone"}
              className="text-[10px] px-1.5 py-0"
            >
              <Code size="2xs" variant="plain" className="text-inherit">P1</Code>
            </Badge>
          </span>
        </TabsTrigger>

        <TabsTrigger
          value="1"
          icon={
            <div
              className={cn(
                "w-5 h-5 rounded overflow-hidden border bg-black/60 shrink-0",
                PLAYER_THEMES.cyan.avatarBorder
              )}
            >
              <CharacterPortrait characterId={p2CharacterId} className="w-full h-full" />
            </div>
          }
          className={cn(
            "gap-2 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none",
            activePlayerIndex === 1
              ? "bg-gradient-to-r from-cyan-950 via-cyan-900 to-cyan-950 text-cyan-200 border-cyan-500/60 shadow-md shadow-cyan-950/50"
              : "bg-black/40 text-stone-400 hover:text-cyan-300 hover:bg-stone-900/60 border-stone-800/80 hover:border-cyan-900/40"
          )}
        >
          <span className="flex items-center gap-1.5">
            <Text weight="bold" size="xs" className="text-inherit">{p2Name}</Text>
            <Badge
              variant={activePlayerIndex === 1 ? "cyan" : "stone"}
              className="text-[10px] px-1.5 py-0"
            >
              <Code size="2xs" variant="plain" className="text-inherit">P2</Code>
            </Badge>
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
});

InventoryPlayerTabs.displayName = "InventoryPlayerTabs";

export default InventoryPlayerTabs;
