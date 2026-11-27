import React, { useState, useMemo, useCallback } from "react";
import { Backpack as BackpackIcon, Shield, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, EmptyState, ConfirmDialog, Code, IconText, Text } from "@ui";
import { useGameSession, useSettings, useInventory } from "@context/GameContext";
import { useI18n } from "@context/I18nContext";
import {
  resolvePaperdollVM,
  resolveInventoryStatsVM,
  resolveInventoryQuickBeltVM,
  resolveBackpackVM,
  resolveItemDetailsVM,
  resolveItemStatComparison,
} from "./inventory.mapper";
import { useInventorySelection } from "./useInventorySelection";
import { useInventoryNavigation } from "./useInventoryNavigation";
import { InventoryPlayerTabs } from "./InventoryPlayerTabs";
import { InventoryPaperdoll } from "./InventoryPaperdoll";
import { InventoryStats } from "./InventoryStats";
import { InventoryQuickBelt } from "./InventoryQuickBelt";
import { InventoryBackpackGrid } from "./InventoryBackpackGrid";
import { InventoryItemDetails } from "./InventoryItemDetails";

/**
 * Container orchestrating the paperdoll, quick belt, backpack grid, stat comparison inspector,
 * keyboard/gamepad navigation, and discard confirmation inside the shared GameMenuDialog body.
 */
export const InventoryPanel: React.FC = () => {
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
    selection,
    selectedBackpackIdx,
    selectedEquipSlot,
    selectedPotionIdx,
    showDetails,
    toggleDetails,
    selectPlayer,
    selectEquipSlot,
    selectBackpackSlot,
    selectPotionSlot,
    moveSelection,
    handleEquip,
    handleUnequip,
    handleUsePotion,
    handleDiscard,
  } = useInventorySelection();

  const selectedItem = useMemo(() => {
    if (selectedBackpackIdx !== null) return activeInventory?.backpack[selectedBackpackIdx] ?? null;
    if (selectedEquipSlot !== null) return activeInventory?.equipment[selectedEquipSlot] ?? null;
    if (selectedPotionIdx !== null) return activeInventory?.quickPotions[selectedPotionIdx] ?? null;
    return null;
  }, [activeInventory, selectedBackpackIdx, selectedEquipSlot, selectedPotionIdx]);

  const paperdollVM = useMemo(() => resolvePaperdollVM(activeInventory?.equipment), [activeInventory?.equipment]);
  const statsVM = useMemo(
    () =>
      resolveInventoryStatsVM(
        activeDerivedStats,
        activePlayer?.health ?? 0,
        activePlayer?.mana ?? 0,
        activePlayer?.stamina ?? 0
      ),
    [activeDerivedStats, activePlayer?.health, activePlayer?.mana, activePlayer?.stamina]
  );
  const quickBeltVM = useMemo(
    () => resolveInventoryQuickBeltVM(activeInventory?.quickPotions, activePlayerIndex === 0),
    [activeInventory?.quickPotions, activePlayerIndex]
  );
  const backpackVM = useMemo(() => resolveBackpackVM(activeInventory?.backpack, 16), [activeInventory?.backpack]);
  const itemDetailsVM = useMemo(() => resolveItemDetailsVM(selectedItem), [selectedItem]);
  const itemComparisonVM = useMemo(() => {
    if (selectedBackpackIdx === null || !selectedItem) return null;
    return resolveItemStatComparison(selectedItem, activeInventory?.equipment);
  }, [selectedBackpackIdx, selectedItem, activeInventory?.equipment]);

  const onEquip = useCallback((idx: number) => handleEquip(idx, equipItem), [handleEquip, equipItem]);
  const onUnequip = useCallback((slot: keyof NonNullable<typeof activeInventory>["equipment"]) => handleUnequip(slot, unequipItem), [handleUnequip, unequipItem]);
  const onUsePotion = useCallback((idx: number) => handleUsePotion(idx, usePotion), [handleUsePotion, usePotion]);

  const nav = useInventoryNavigation({
    selection,
    selectedBackpackIdx,
    selectedItem,
    activeInventory,
    isBackpackEmpty: backpackVM.isEmpty,
    isConfirmOpen: pendingDiscardIdx !== null,
    moveSelection,
    toggleDetails,
    onEquip,
    onUnequip,
    onUsePotion,
    onRequestDiscard: setPendingDiscardIdx,
  });

  const handleConfirmDiscard = useCallback(() => {
    if (pendingDiscardIdx === null) return;
    handleDiscard(pendingDiscardIdx, discardItem);
    setPendingDiscardIdx(null);
  }, [handleDiscard, discardItem, pendingDiscardIdx]);

  if (!p1 || !activePlayer || !activeInventory) return null;
  const characterId = activePlayer.characterId || (activePlayerIndex === 0 ? "valen" : "aurelia");

  return (
    <div id="inventory-container" className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-stone-800">
        <InventoryPlayerTabs
          p1={p1}
          p2={p2}
          isTwoPlayer={isTwoPlayer}
          activePlayerIndex={activePlayerIndex}
          onSelectPlayer={(idx) => selectPlayer(idx, setActivePlayerIndex)}
          p1Name={p1.characterId === "aurelia" ? t("aurelia") : t("valen")}
          p2Name={p2?.characterId === "valen" ? t("valen") : t("aurelia")}
        />
        <Text size="2xs" variant="muted" className="font-mono">
          {t("inventoryControlsHint")}
        </Text>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5 flex flex-col">
          <Card variant="default" className="p-3">
            <CardHeader className="pb-1.5">
              <CardTitle className="text-sm flex items-center gap-1.5 text-stone-300">
                <Shield size={15} className="text-amber-400" />
                {t("paperdoll")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 gap-1.5">
              <InventoryPaperdoll
                paperdoll={paperdollVM}
                characterId={characterId}
                selectedSlot={selectedEquipSlot}
                registerSlotRef={nav.registerSlotRef}
                onSlotPointerDown={nav.handleSlotPointerDown}
                onSlotFocus={(slot) => nav.handleSlotFocus({ kind: "equipment", slot }, () => selectEquipSlot(slot))}
                onSelectSlot={(slot) => nav.handleSlotClick({ kind: "equipment", slot }, () => selectEquipSlot(slot))}
                onSlotKeyDown={(e, slot) => nav.handleSlotKeyDown(e, { kind: "equipment", slot })}
              />
              <InventoryStats stats={statsVM} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-2">
          <Card variant="default" className="p-2.5">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center gap-1.5 text-stone-300">
                <Sparkles size={15} className="text-amber-400" />
                {t("quickBelt")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InventoryQuickBelt
                belt={quickBeltVM}
                selectedPotionIdx={selectedPotionIdx}
                registerSlotRef={nav.registerSlotRef}
                onSlotPointerDown={nav.handleSlotPointerDown}
                onSlotFocus={(idx) => nav.handleSlotFocus({ kind: "potion", index: idx }, () => selectPotionSlot(idx))}
                onSelectPotion={(idx) => nav.handleSlotClick({ kind: "potion", index: idx }, () => selectPotionSlot(idx))}
                onSlotKeyDown={(e, idx) => nav.handleSlotKeyDown(e, { kind: "potion", index: idx })}
              />
            </CardContent>
          </Card>

          <Card variant="default" className="p-2.5">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm flex items-center justify-between">
                <IconText size="sm" className="text-stone-300" icon={<BackpackIcon size={15} className="text-amber-400" />}>
                  {t("backpack")}
                </IconText>
                <Code size="xs" variant="plain" className="text-stone-500 tabular-nums">
                  {backpackVM.occupiedCount} / {backpackVM.totalCapacity}
                </Code>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InventoryBackpackGrid
                grid={backpackVM}
                selectedBackpackIdx={selectedBackpackIdx}
                registerSlotRef={nav.registerSlotRef}
                onSlotPointerDown={nav.handleSlotPointerDown}
                onSlotFocus={(idx) => nav.handleSlotFocus({ kind: "backpack", index: idx }, () => selectBackpackSlot(idx))}
                onSelectSlot={(idx) => nav.handleSlotClick({ kind: "backpack", index: idx }, () => selectBackpackSlot(idx))}
                onSlotKeyDown={(e, idx) => nav.handleSlotKeyDown(e, { kind: "backpack", index: idx })}
              />
            </CardContent>
          </Card>

          {itemDetailsVM ? (
            <InventoryItemDetails
              details={itemDetailsVM}
              comparison={itemComparisonVM}
              showDetails={showDetails}
              onToggleDetails={toggleDetails}
              selectedBackpackIdx={selectedBackpackIdx}
              selectedEquipSlot={selectedEquipSlot}
              selectedPotionIdx={selectedPotionIdx}
              onEquip={onEquip}
              onUnequip={onUnequip}
              onUsePotion={onUsePotion}
              onDiscard={setPendingDiscardIdx}
            />
          ) : (
            <EmptyState
              compact
              icon={<BackpackIcon size={18} className="text-stone-500" />}
              title={t("inspectorEmptyTitle")}
              description={t("inspectorEmptyHint")}
              className="border-dashed border-stone-800/80"
            />
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingDiscardIdx !== null}
        onClose={() => setPendingDiscardIdx(null)}
        onConfirm={handleConfirmDiscard}
        title={t("discardConfirmTitle")}
        message={t("discardConfirmMessage")}
        confirmLabel={t("discardConfirmLabel")}
        cancelLabel={t("confirmCancelBtn")}
      />
    </div>
  );
};

InventoryPanel.displayName = "InventoryPanel";

export default InventoryPanel;
