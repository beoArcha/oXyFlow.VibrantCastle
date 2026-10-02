import type React from "react";
import type {
  ICharacterIdentity,
  IVitalResources,
  InventoryState,
  MagicSkill,
  DisplaySettings,
} from "@game/types";
import type { AssetQuality } from "@/types/assets";
import type { PlayerTheme } from "@styles/theme";

export * from "./viewModels";

export interface HUDOverlayProps {
  readonly onOpenInventory: () => void;
  readonly onOpenSkillTree: () => void;
  readonly onOpenHelp: () => void;
  readonly onOpenMenu: () => void;
  readonly onOpenCreation?: () => void;
  readonly onTogglePause?: () => void;
}

export interface HUDOverlayLayoutProps {
  readonly viewportSlot: React.ReactNode;
  readonly topLeftSlot?: React.ReactNode;
  readonly topCenterSlot?: React.ReactNode;
  readonly topRightSlot?: React.ReactNode;
  readonly leftFlankSlot?: React.ReactNode;
  readonly rightFlankSlot?: React.ReactNode;
  readonly bottomSlot?: React.ReactNode;
  readonly statusOverlaySlot?: React.ReactNode;
}

export type HUDPlayerStatusData = ICharacterIdentity &
  IVitalResources & {
    readonly skillPoints?: number;
  };

export interface HUDPlayerStatusCardProps {
  readonly player: HUDPlayerStatusData;
  readonly playerNumber: 1 | 2;
  readonly characterName: string;
  readonly themeColor?: PlayerTheme | "red";
  readonly theme?: PlayerTheme | "red";
  readonly assetQuality: AssetQuality;
  readonly attackPower: number;
  readonly onOpenSkillTree?: () => void;
}

export interface HUDTopControlsProps {
  readonly isPaused: boolean;
  readonly onTogglePause: () => void;
  readonly onOpenHelp: () => void;
  readonly onOpenMenu: () => void;
  readonly onOpenCreation?: () => void;
  readonly showCreation?: boolean;
  readonly locationName: string;
}

export interface HUDQuickBeltData {
  readonly inventory: InventoryState;
}

export interface HUDQuickBeltProps {
  readonly player: HUDQuickBeltData;
  readonly playerNumber: 1 | 2;
  readonly primarySpell: MagicSkill | null;
  readonly secondarySpell: MagicSkill | null;
  readonly primarySpellName: string;
  readonly secondarySpellName: string;
  readonly primaryKeyLabel: string;
  readonly secondaryKeyLabel: string;
  readonly potionKeyRangeLabel: string;
  readonly onUsePotion: (slotIndex: number) => void;
  readonly onOpenInventory?: () => void;
  readonly onOpenSkillTree?: () => void;
  readonly showRpgButtons?: boolean;
}

export interface HUDNarratorBannerProps {
  readonly narration: string | null;
  readonly isAnimating: boolean;
}

export interface PauseOverlayProps {
  readonly onResume: () => void;
  readonly onOpenHelp: () => void;
  readonly onOpenMenu: () => void;
  readonly onOpenInventory?: () => void;
  readonly onOpenSkillTree?: () => void;
}

export interface VictoryOverlayProps {
  readonly onNextLocation: () => void;
  readonly onOpenMenu: () => void;
}

export interface DefeatOverlayProps {
  readonly onRestart: () => void;
  readonly onOpenMenu: () => void;
}

export interface HUDStatusOverlayProps
  extends PauseOverlayProps,
    VictoryOverlayProps,
    DefeatOverlayProps {
  readonly isPaused: boolean;
  readonly isVictory: boolean;
  readonly isDefeat: boolean;
}

export interface HUDViewportCanvasProps {
  readonly displaySettings: DisplaySettings;
  readonly children?: React.ReactNode;
}

export interface HUDControlsHintProps {
  readonly isAudioInitialized: boolean;
  readonly onInitializeAudio: () => void;
}
