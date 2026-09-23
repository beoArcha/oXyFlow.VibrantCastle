import { ICharacterIdentity, IVitalResources, InventoryState, MagicSkill } from "../../game/types";

export interface HUDOverlayProps {
  onOpenInventory: () => void;
  onOpenSkillTree: () => void;
  onOpenHelp: () => void;
  onOpenMenu: () => void;
  onOpenCreation?: () => void;
  onTogglePause?: () => void;
}

export interface HUDOverlayLayoutProps {
  viewportSlot: React.ReactNode;
  topLeftSlot?: React.ReactNode;
  topCenterSlot?: React.ReactNode;
  topRightSlot?: React.ReactNode;
  leftFlankSlot?: React.ReactNode;
  rightFlankSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  statusOverlaySlot?: React.ReactNode;
}

export type HUDPlayerStatusData = ICharacterIdentity & IVitalResources & {
  skillPoints?: number;
};

export interface HUDPlayerStatusCardProps {
  player: HUDPlayerStatusData;
  playerNumber: 1 | 2;
  characterName: string;
  themeColor: "red" | "cyan";
  assetQuality: "low" | "mid" | "high";
  attackPower: number;
  onOpenSkillTree?: () => void;
}

export interface HUDTopControlsProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenHelp: () => void;
  onOpenMenu: () => void;
  onOpenCreation?: () => void;
  showCreation?: boolean;
  locationName: string;
}

export interface HUDQuickBeltData {
  inventory: InventoryState;
}

export interface HUDQuickBeltProps {
  player: HUDQuickBeltData;
  playerNumber: 1 | 2;
  primarySpell: MagicSkill | null;
  secondarySpell: MagicSkill | null;
  primarySpellName: string;
  secondarySpellName: string;
  primaryKeyLabel: string;
  secondaryKeyLabel: string;
  potionKeyRangeLabel: string;
  onUsePotion: (slotIndex: number) => void;
  onOpenInventory?: () => void;
  onOpenSkillTree?: () => void;
  showRpgButtons?: boolean;
}

export interface HUDNarratorBannerProps {
  narration: string | null;
  isAnimating: boolean;
}

export interface HUDStatusOverlayProps {
  isPaused: boolean;
  isVictory: boolean;
  isDefeat: boolean;
  onResume: () => void;
  onOpenHelp: () => void;
  onOpenMenu: () => void;
  onOpenInventory?: () => void;
  onOpenSkillTree?: () => void;
  onNextLocation: () => void;
  onRestart: () => void;
}
