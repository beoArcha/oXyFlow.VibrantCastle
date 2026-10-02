import React from "react";
import { Backpack as BackpackIcon, Shield, Sparkles } from "lucide-react";
import { Modal, Card, CardHeader, CardTitle, CardContent } from "../ui";
import { LanguageSelector } from "@components/adapters";
import { ModalNavigationTabs, ModalType } from "@components/modal";
import { CharacterPortrait } from "../character";
import { useGameSession, useSettings, useInventory } from "@context/GameContext";
import { useI18n } from "@context/I18nContext";
import { useInventorySelection } from "./useInventorySelection";

import { InventoryPlayerTabs } from "./InventoryPlayerTabs";
import { InventoryPaperdoll } from "./InventoryPaperdoll";
import { InventoryStats } from "./InventoryStats";
import { InventoryQuickBelt } from "./InventoryQuickBelt";
import { InventoryBackpackGrid } from "./InventoryBackpackGrid";
import { InventoryItemDetails } from "./InventoryItemDetails";

export interface InventoryPanelProps {
  onClose: () => void;
  onNavigateModal?: (modal: ModalType) => void;
  onResume?: () => void;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
  onClose,
  onNavigateModal,
  onResume,
}) => {
  const { displaySettings, isTwoPlayer } = useSettings();
  const { p1, p2 } = useGameSession();
  const {
    activePlayerIndex,
    setActivePlayerIndex,
    activePlayer,
    activeInventory,
    activeDerivedStats,
    equipItem,
    unequipItem,
    usePotion,
    discardItem,
  } = useInventory();
  const { t } = useI18n();

  const {
    selectedItem,
    selectedBackpackIdx,
    selectedEquipSlot,
    selectedPotionIdx,
    selectPlayer,
    selectEquipSlot,
    selectBackpackSlot,
    selectPotionSlot,
    handleEquip,
    handleUnequip,
    handleUsePotion,
    handleDiscard,
  } = useInventorySelection();

  if (!activePlayer || !activeInventory) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t("inventoryTitle")}
      subtitle={t("inventorySubtitle")}
      icon={<BackpackIcon className="text-amber-400" size={20} />}
      headerRight={<LanguageSelector />}
      maxWidthClass="max-w-4xl"
    >
      <div id="inventory-container" className="flex flex-col gap-4">
        {onNavigateModal && onResume && (
          <ModalNavigationTabs
            currentModal="inventory"
            onNavigate={onNavigateModal}
            onResume={onResume}
          />
        )}
        {/* Top Bar: Player Selection & Character Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
          <InventoryPlayerTabs
            p1={p1!}
            p2={p2}
            isTwoPlayer={isTwoPlayer}
            activePlayerIndex={activePlayerIndex}
            onSelectPlayer={(idx) => selectPlayer(idx, setActivePlayerIndex)}
            p1Name={t("valen")}
            p2Name={t("aurelia")}
            assetQuality={displaySettings.assetQuality}
          />
        </div>

        {/* Main Grid: Paperdoll & Stats on Left, Backpack & Quick Belt on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Equipment Silhouette + Derived Stats */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <Card variant="default">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-300">
                    <Shield size={15} className="text-amber-400" />
                    {t("paperdoll")}
                  </span>
                  <span className="text-[10px] font-mono text-stone-500 uppercase">
                    BG2 Paperdoll
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Visual Character Avatar in Center of Paperdoll */}
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-600/40 bg-stone-950/80 shadow-inner flex items-center justify-center">
                    <CharacterPortrait
                      characterId={activePlayer.characterId || (activePlayerIndex === 0 ? "valen" : "aurelia")}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <InventoryPaperdoll
                  equipment={activeInventory.equipment}
                  selectedSlot={selectedEquipSlot}
                  onSelectSlot={selectEquipSlot}
                />

                <InventoryStats
                  currentHp={activePlayer.health}
                  currentMana={activePlayer.mana}
                  currentStamina={activePlayer.stamina}
                  derivedStats={activeDerivedStats}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Traveling Backpack & Quick Potion Belt */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Quick Potion Belt */}
            <Card variant="default">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-stone-300">
                  <Sparkles size={15} className="text-amber-400" />
                  {t("quickBelt")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <InventoryQuickBelt
                  quickPotions={activeInventory.quickPotions}
                  selectedPotionIdx={selectedPotionIdx}
                  onSelectPotion={selectPotionSlot}
                  onDrinkPotion={(idx) => handleUsePotion(idx, usePotion, activeInventory)}
                />
              </CardContent>
            </Card>

            {/* Traveling Backpack (16 Slots) */}
            <Card variant="default">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-300">
                    <BackpackIcon size={15} className="text-amber-400" />
                    {t("backpack")}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    {activeInventory.backpack.filter(Boolean).length} / 16
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <InventoryBackpackGrid
                  backpack={activeInventory.backpack}
                  selectedBackpackIdx={selectedBackpackIdx}
                  onSelectSlot={selectBackpackSlot}
                  maxSlots={16}
                />
              </CardContent>
            </Card>

            {/* Selected Item Inspector / Details */}
            {selectedItem ? (
              <InventoryItemDetails
                item={selectedItem}
                selectedBackpackIdx={selectedBackpackIdx}
                selectedEquipSlot={selectedEquipSlot}
                selectedPotionIdx={selectedPotionIdx}
                onEquip={(idx) => handleEquip(idx, equipItem)}
                onUnequip={(slot) => handleUnequip(slot, unequipItem)}
                onUsePotion={(idx) => handleUsePotion(idx, usePotion, activeInventory)}
                onDiscard={(idx) => handleDiscard(idx, discardItem)}
              />
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-stone-800 text-center text-xs text-stone-500">
                {t("emptySlot")} — {t("backpack")}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InventoryPanel;
