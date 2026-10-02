import React, { useMemo, useCallback } from "react";
import { Backpack as BackpackIcon, Shield, Sparkles } from "lucide-react";
import { Modal, Card, CardHeader, CardTitle, CardContent, EmptyState } from "@components/ui";
import { LanguageSelector } from "@components/adapters";
import { ModalNavigationTabs, ModalType } from "@components/modal";
import { CharacterPortrait } from "../character";
import { useGameSession, useSettings, useInventory } from "@context/GameContext";
import { useI18n } from "@context/I18nContext";
import {
  EquipmentSlotKey,
  resolvePaperdollVM,
  resolveInventoryStatsVM,
  resolveInventoryQuickBeltVM,
  resolveBackpackVM,
  resolveItemDetailsVM,
} from "@components/adapters/inventoryAdapter";
import { useInventorySelection } from "./useInventorySelection";
import { InventoryPlayerTabs } from "./InventoryPlayerTabs";
import { InventoryPaperdoll } from "./InventoryPaperdoll";
import { InventoryStats } from "./InventoryStats";
import { InventoryQuickBelt } from "./InventoryQuickBelt";
import { InventoryBackpackGrid } from "./InventoryBackpackGrid";
import { InventoryItemDetails } from "./InventoryItemDetails";

export interface InventoryPanelProps {
  readonly onClose: () => void;
  readonly onNavigateModal?: (modal: ModalType) => void;
  readonly onResume?: () => void;
}

/**
 * Container component orchestrating inventory data fetching, selection state,
 * and presenting ViewModels across Gothic paperdoll, backpack, stats, and item inspector.
 */
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

  const paperdollVM = useMemo(
    () => resolvePaperdollVM(activeInventory?.equipment),
    [activeInventory?.equipment]
  );

  const statsVM = useMemo(
    () =>
      resolveInventoryStatsVM(
        activeDerivedStats,
        activePlayer?.health ?? 0,
        activePlayer?.mana ?? 0,
        activePlayer?.stamina ?? 0
      ),
    [
      activeDerivedStats,
      activePlayer?.health,
      activePlayer?.mana,
      activePlayer?.stamina,
    ]
  );

  const quickBeltVM = useMemo(
    () => resolveInventoryQuickBeltVM(activeInventory?.quickPotions, activePlayerIndex === 0),
    [activeInventory?.quickPotions, activePlayerIndex]
  );

  const backpackVM = useMemo(
    () => resolveBackpackVM(activeInventory?.backpack, 16),
    [activeInventory?.backpack]
  );

  const itemDetailsVM = useMemo(
    () => resolveItemDetailsVM(selectedItem),
    [selectedItem]
  );

  const handleSelectPlayer = useCallback(
    (idx: number) => {
      selectPlayer(idx, setActivePlayerIndex);
    },
    [selectPlayer, setActivePlayerIndex]
  );

  const handleSelectEquipSlot = useCallback(
    (slotKey: EquipmentSlotKey) => {
      const item = activeInventory?.equipment[slotKey] ?? null;
      selectEquipSlot(slotKey, item);
    },
    [activeInventory?.equipment, selectEquipSlot]
  );

  const handleSelectBackpackSlot = useCallback(
    (idx: number) => {
      const item = activeInventory?.backpack[idx] ?? null;
      selectBackpackSlot(idx, item);
    },
    [activeInventory?.backpack, selectBackpackSlot]
  );

  const handleSelectPotionSlot = useCallback(
    (idx: number) => {
      const item = activeInventory?.quickPotions[idx] ?? null;
      selectPotionSlot(idx, item);
    },
    [activeInventory?.quickPotions, selectPotionSlot]
  );

  const handleDrinkPotion = useCallback(
    (idx: number) => {
      handleUsePotion(idx, usePotion, activeInventory);
    },
    [handleUsePotion, usePotion, activeInventory]
  );

  const handleEquipItem = useCallback(
    (idx: number) => {
      handleEquip(idx, equipItem);
    },
    [handleEquip, equipItem]
  );

  const handleUnequipItem = useCallback(
    (slotKey: EquipmentSlotKey) => {
      handleUnequip(slotKey, unequipItem);
    },
    [handleUnequip, unequipItem]
  );

  const handleDiscardItem = useCallback(
    (idx: number) => {
      handleDiscard(idx, discardItem);
    },
    [handleDiscard, discardItem]
  );

  if (!p1 || !activePlayer || !activeInventory) return null;

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

        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-800">
          <InventoryPlayerTabs
            p1={p1}
            p2={p2}
            isTwoPlayer={isTwoPlayer}
            activePlayerIndex={activePlayerIndex}
            onSelectPlayer={handleSelectPlayer}
            p1Name={t("valen")}
            p2Name={t("aurelia")}
            assetQuality={displaySettings.assetQuality}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 flex flex-col gap-3">
            <Card variant="default">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-stone-300">
                  <Shield size={15} className="text-amber-400" />
                  {t("paperdoll")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-amber-600/40 bg-stone-950/80 shadow-inner flex items-center justify-center">
                    <CharacterPortrait
                      characterId={activePlayer.characterId || (activePlayerIndex === 0 ? "valen" : "aurelia")}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <InventoryPaperdoll
                  paperdoll={paperdollVM}
                  selectedSlot={selectedEquipSlot}
                  onSelectSlot={handleSelectEquipSlot}
                />

                <InventoryStats stats={statsVM} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-3">
            <Card variant="default">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5 text-stone-300">
                  <Sparkles size={15} className="text-amber-400" />
                  {t("quickBelt")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <InventoryQuickBelt
                  belt={quickBeltVM}
                  selectedPotionIdx={selectedPotionIdx}
                  onSelectPotion={handleSelectPotionSlot}
                  onDrinkPotion={handleDrinkPotion}
                />
              </CardContent>
            </Card>

            <Card variant="default">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-stone-300">
                    <BackpackIcon size={15} className="text-amber-400" />
                    {t("backpack")}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    {backpackVM.occupiedCount} / {backpackVM.totalCapacity}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <InventoryBackpackGrid
                  grid={backpackVM}
                  selectedBackpackIdx={selectedBackpackIdx}
                  onSelectSlot={handleSelectBackpackSlot}
                  maxSlots={16}
                />
              </CardContent>
            </Card>

            {itemDetailsVM ? (
              <InventoryItemDetails
                details={itemDetailsVM}
                selectedBackpackIdx={selectedBackpackIdx}
                selectedEquipSlot={selectedEquipSlot}
                selectedPotionIdx={selectedPotionIdx}
                onEquip={handleEquipItem}
                onUnequip={handleUnequipItem}
                onUsePotion={handleDrinkPotion}
                onDiscard={handleDiscardItem}
              />
            ) : (
              <EmptyState
                compact
                icon={<BackpackIcon size={20} className="text-stone-600" />}
                title={t("emptySlot")}
                description={t("backpack")}
                className="border-dashed border-stone-800/80"
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InventoryPanel;
