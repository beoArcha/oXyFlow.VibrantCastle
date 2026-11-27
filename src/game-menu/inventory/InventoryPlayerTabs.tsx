import React from "react";
import { User } from "lucide-react";
import { CharacterPortrait } from "../character";
import { Badge, Button, Text, Code } from "@ui";
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
 * Player switcher for 1P/2P inventory inspection using Buttons to avoid extra tablists.
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
    <div className="flex flex-wrap items-center gap-1.5 bg-stone-950/80 p-1 rounded-xl border border-stone-800">
      <Button
        size="sm"
        variant={activePlayerIndex === 0 ? "primary" : "secondary"}
        aria-pressed={activePlayerIndex === 0}
        onClick={() => onSelectPlayer(0)}
        leftIcon={
          <div className={cn("w-5 h-5 rounded overflow-hidden border bg-black/60 shrink-0", PLAYER_THEMES.crimson.avatarBorder)}>
            <CharacterPortrait characterId={p1CharacterId} className="w-full h-full" />
          </div>
        }
        className="gap-2 px-3 py-1.5"
      >
        <span className="flex items-center gap-1.5">
          <Text weight="bold" size="xs" className="text-inherit">{p1Name}</Text>
          <Badge variant={activePlayerIndex === 0 ? "red" : "stone"} className="text-[10px] px-1.5 py-0">
            <Code size="2xs" variant="plain" className="text-inherit">P1</Code>
          </Badge>
        </span>
      </Button>

      <Button
        size="sm"
        variant={activePlayerIndex === 1 ? "primary" : "secondary"}
        aria-pressed={activePlayerIndex === 1}
        onClick={() => onSelectPlayer(1)}
        leftIcon={
          <div className={cn("w-5 h-5 rounded overflow-hidden border bg-black/60 shrink-0", PLAYER_THEMES.cyan.avatarBorder)}>
            <CharacterPortrait characterId={p2CharacterId} className="w-full h-full" />
          </div>
        }
        className="gap-2 px-3 py-1.5"
      >
        <span className="flex items-center gap-1.5">
          <Text weight="bold" size="xs" className="text-inherit">{p2Name}</Text>
          <Badge variant={activePlayerIndex === 1 ? "cyan" : "stone"} className="text-[10px] px-1.5 py-0">
            <Code size="2xs" variant="plain" className="text-inherit">P2</Code>
          </Badge>
        </span>
      </Button>
    </div>
  );
});

InventoryPlayerTabs.displayName = "InventoryPlayerTabs";

export default InventoryPlayerTabs;
