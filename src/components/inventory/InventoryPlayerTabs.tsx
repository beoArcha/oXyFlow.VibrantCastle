import React from "react";
import { Users, User } from "lucide-react";
import { ICharacterIdentity } from "@game/types";
import { CharacterPortrait } from "../character";
import { cn } from "@lib/utils";

export interface InventoryPlayerTabsProps {
  p1: ICharacterIdentity;
  p2?: ICharacterIdentity;
  isTwoPlayer: boolean;
  activePlayerIndex: number;
  onSelectPlayer: (index: number) => void;
  p1Name: string;
  p2Name: string;
  assetQuality: "low" | "mid" | "high";
}

export const InventoryPlayerTabs: React.FC<InventoryPlayerTabsProps> = ({
  p1,
  p2,
  isTwoPlayer,
  activePlayerIndex,
  onSelectPlayer,
  p1Name,
  p2Name,
  assetQuality,
}) => {
  if (!isTwoPlayer || !p2) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-stone-800">
        <User size={14} className="text-amber-400" />
        <span className="text-xs font-bold text-amber-300 tracking-wide uppercase">
          {p1Name}
        </span>
        <span className="text-[10px] font-mono text-stone-400">
          ({assetQuality.toUpperCase()})
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-stone-950/80 p-1 rounded-xl border border-stone-800">
      <button
        type="button"
        onClick={() => onSelectPlayer(0)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
          activePlayerIndex === 0
            ? "bg-red-950/90 text-red-200 border border-red-500/60 shadow-md shadow-red-950/50"
            : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/60 border border-transparent"
        )}
      >
        <div className="w-5 h-5 rounded overflow-hidden border border-red-500/40 bg-black/60 shrink-0">
          <CharacterPortrait
            characterId={p1.characterId || "valen"}
            tier={p1.characterTier || 1}
            quality={assetQuality}
            className="w-full h-full"
          />
        </div>
        <span>{p1Name} (P1)</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectPlayer(1)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none",
          activePlayerIndex === 1
            ? "bg-cyan-950/90 text-cyan-200 border border-cyan-500/60 shadow-md shadow-cyan-950/50"
            : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/60 border border-transparent"
        )}
      >
        <div className="w-5 h-5 rounded overflow-hidden border border-cyan-500/40 bg-black/60 shrink-0">
          <CharacterPortrait
            characterId={p2.characterId || "aurelia"}
            tier={p2.characterTier || 1}
            quality={assetQuality}
            className="w-full h-full"
          />
        </div>
        <span>{p2Name} (P2)</span>
      </button>
    </div>
  );
};

export default InventoryPlayerTabs;
