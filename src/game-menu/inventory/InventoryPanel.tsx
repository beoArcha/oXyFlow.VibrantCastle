import React, { useState, useMemo, useCallback } from "react";
import { Backpack as BackpackIcon, Shield, Sparkles } from "lucide-react";
import {
  Modal,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  EmptyState,
  ConfirmDialog,
  Code,
} from "@ui";
import { LanguageSelector } from "@game-menu/common";
import { ModalNavigationTabs, ModalType } from "@game-menu/modal";
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
} from "./inventory.mapper";
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
  const { isTwoPlayer } = useSettings();
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

  const [pendingDiscardIdx, setPendingDiscardIdx] = useState<number | null>(null);

  const {
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

  const selectedItem = useMemo(() => {
    if (selectedBackpackIdx !== null) {
      return activeInventory?.backpack[selectedBackpackIdx] ?? null;
    }
    if (selectedEquipSlot !== null) {
      return activeInventory?.equipment[selectedEquipSlot] ?? null;
    }
    if (selectedPotionIdx !== null) {
      return activeInventory?.quickPotions[selectedPotionIdx] ?? null;
    }
    return null;
  }, [activeInventory, selectedBackpackIdx, selectedEquipSlot, selectedPotionIdx]);

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
      selectEquipSlot(slotKey);
    },
    [selectEquipSlot]
  );

  const handleSelectBackpackSlot = useCallback(
    (idx: number) => {
      selectBackpackSlot(idx);
    },
    [selectBackpackSlot]
  );

  const handleSelectPotionSlot = useCallback(
    (idx: number) => {
      selectPotionSlot(idx);
    },
    [selectPotionSlot]
  );

  const handleUsePotionSlot = useCallback(
    (idx: number) => {
      handleUsePotion(idx, usePotion);
    },
    [handleUsePotion, usePotion]
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

  const handlePromptDiscard = useCallback((idx: number) => {
    setPendingDiscardIdx(idx);
  }, []);

  const handleConfirmDiscard = useCallback(() => {
    if (pendingDiscardIdx !== null) {
      handleDiscard(pendingDiscardIdx, discardItem);
      setPendingDiscardIdx(null);
    }
  }, [handleDiscard, discardItem, pendingDiscardIdx]);

  const handleCancelDiscard = useCallback(() => {
    setPendingDiscardIdx(null);
  }, []);

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
                  onUsePotion={handleUsePotionSlot}
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
                  <Code size="xs" variant="plain" className="text-stone-500">
                    {backpackVM.occupiedCount} / {backpackVM.totalCapacity}
                  </Code>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <InventoryBackpackGrid
                  grid={backpackVM}
                  selectedBackpackIdx={selectedBackpackIdx}
                  onSelectSlot={handleSelectBackpackSlot}
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
                onUsePotion={handleUsePotionSlot}
                onDiscard={handlePromptDiscard}
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

      <ConfirmDialog
        isOpen={pendingDiscardIdx !== null}
        onClose={handleCancelDiscard}
        onConfirm={handleConfirmDiscard}
        title={t("discardItem")}
        message={t("discardItem")}
        confirmLabel={t("discardItem")}
        cancelLabel={t("cancel")}
        confirmVariant="danger"
      />
    </Modal>
  );
};

export default InventoryPanel;
