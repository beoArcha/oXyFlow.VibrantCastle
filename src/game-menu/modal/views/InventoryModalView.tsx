import React, { useState, useMemo } from "react";
import { Trash2, Shield, Sparkles, Coins, Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  ConfirmDialog,
  Text,
  Paragraph,
  StatRow,
} from "@ui";
import { useI18n } from "@context/I18nContext";
import { useInventory } from "@context/InventoryContext";
import { useSettings } from "@context/SettingsContext";
import { EquipmentState, Item, PlayerId } from "@game/types";

const EQUIPMENT_SLOT_KEYS: readonly {
  readonly slot: keyof EquipmentState;
  readonly labelKey: string;
}[] = [
  { slot: "mainHand", labelKey: "mainHand" },
  { slot: "offHand", labelKey: "offHand" },
  { slot: "helmet", labelKey: "helmet" },
  { slot: "armor", labelKey: "armor" },
  { slot: "amulet", labelKey: "amulet" },
  { slot: "ring", labelKey: "ring" },
];

type SelectedItemRef =
  | { source: "backpack"; index: number; item: Item }
  | { source: "equipment"; slot: keyof EquipmentState; item: Item };

function getRarityBadgeVariant(
  rarity: string | undefined
): "amber" | "cyan" | "green" | "stone" {
  if (rarity === "legendary") return "amber";
  if (rarity === "rare") return "cyan";
  if (rarity === "uncommon") return "green";
  return "stone";
}

function getRarityLabelKey(rarity: string | undefined): string {
  if (rarity === "legendary") return "rarityLegendary";
  if (rarity === "rare") return "rarityRare";
  if (rarity === "uncommon") return "rarityUncommon";
  return "rarityCommon";
}

/**
 * Upgraded RPG Inventory view with P1/P2 character switcher, gold/score header,
 * rarity-coded slots, and a detailed item inspector panel.
 */
export const InventoryModalView: React.FC = () => {
  const { t } = useI18n();
  const { isTwoPlayer } = useSettings();
  const {
    activePlayer,
    activePlayerIndex,
    setActivePlayerIndex,
    activeInventory,
    activeDerivedStats,
    equipItem,
    unequipItem,
    usePotion,
    discardItem,
  } = useInventory();

  const [selectedRef, setSelectedRef] = useState<SelectedItemRef | null>(null);
  const [pendingDiscardIndex, setPendingDiscardIndex] = useState<number | null>(null);
  const backpackItems = activeInventory?.backpack ?? [];
  const isBackpackEmpty = backpackItems.every((entry) => !entry);

  // Resolve current item from live inventory so inspector never shows stale entries
  const inspectedItem = useMemo<SelectedItemRef | null>(() => {
    if (!selectedRef || !activeInventory) return null;
    if (selectedRef.source === "backpack") {
      const live = activeInventory.backpack[selectedRef.index];
      return live ? { source: "backpack", index: selectedRef.index, item: live } : null;
    }
    const live = activeInventory.equipment[selectedRef.slot];
    return live ? { source: "equipment", slot: selectedRef.slot, item: live } : null;
  }, [selectedRef, activeInventory]);

  return (
    <div className="flex flex-col gap-4">
      {/* Player Switcher & Gold/Score Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-black/40 border border-stone-800">
        <div className="flex flex-wrap items-center gap-2">
          <Users size={15} className="text-amber-400" />
          <Text size="xs" weight="semibold" className="text-stone-200">
            {activePlayer?.id === PlayerId.Player2 ? t("p2Status") : t("p1Status")}
          </Text>
          {isTwoPlayer && (
            <div className="flex items-center gap-1.5 ml-2">
              <Button
                size="sm"
                variant={activePlayerIndex === 0 ? "primary" : "secondary"}
                onClick={() => {
                  setActivePlayerIndex(0);
                  setSelectedRef(null);
                }}
                className="whitespace-nowrap shrink-0"
              >
                {t("p1Status")}
              </Button>
              <Button
                size="sm"
                variant={activePlayerIndex === 1 ? "primary" : "secondary"}
                onClick={() => {
                  setActivePlayerIndex(1);
                  setSelectedRef(null);
                }}
                className="whitespace-nowrap shrink-0"
              >
                {t("p2Status")}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 tabular-nums">
          <Badge variant="amber" icon={<Coins size={12} />}>
            {activePlayer?.score ?? 0} PTS
          </Badge>
          <Badge variant="green">
            HP {Math.round(activePlayer?.health ?? 0)}/{activeDerivedStats.maxHp}
          </Badge>
          <Badge variant="cyan">
            MP {Math.round(activePlayer?.mana ?? 0)}/{activeDerivedStats.maxMana}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Paperdoll & Derived Combat Stats */}
        <Card variant="subtle" className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <Shield size={15} className="text-amber-400" />
              {t("paperdoll")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <StatRow label={t("attackPower")} value={String(activeDerivedStats.totalAttack)} />
              <StatRow label={t("defense")} value={String(activeDerivedStats.totalDefense)} />
              <StatRow label={t("health")} value={String(activeDerivedStats.maxHp)} />
              <StatRow label={t("mana")} value={String(activeDerivedStats.maxMana)} />
              <StatRow label={t("stamina")} value={String(activeDerivedStats.maxStamina)} />
            </div>

            <div className="pt-2 border-t border-stone-800 flex flex-col gap-1.5">
              {EQUIPMENT_SLOT_KEYS.map(({ slot, labelKey }) => {
                const item = activeInventory?.equipment[slot];
                const isSelected =
                  inspectedItem?.source === "equipment" && inspectedItem.slot === slot;
                return (
                  <div
                    key={slot}
                    className={`flex items-center justify-between gap-2 text-xs py-1.5 px-2.5 rounded-lg border transition-colors ${
                      isSelected
                        ? "bg-amber-950/40 border-amber-500/70"
                        : item
                          ? "bg-black/30 border-stone-800"
                          : "bg-transparent border-dashed border-stone-700"
                    }`}
                  >
                    <Text
                      size="2xs"
                      variant="muted"
                      className={item ? "truncate" : "truncate italic"}
                    >
                      {t(labelKey)}
                    </Text>
                    {item ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRef({ source: "equipment", slot, item })}
                          className="h-6 px-2 text-xs text-amber-200 whitespace-nowrap"
                        >
                          {t(item.nameKey)}
                        </Button>
                        <Badge variant={getRarityBadgeVariant(item.rarity)}>
                          {t(getRarityLabelKey(item.rarity))}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => unequipItem(slot)}
                          className="h-6 px-1.5 text-xs"
                          aria-label={t("unequipItem")}
                        >
                          ×
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: Quick Potion Belt + Backpack Grid + Selected Item Inspector */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Card variant="subtle">
            <CardHeader>
              <CardTitle>{t("quickBelt")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(activeInventory?.quickPotions ?? []).map((potion, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant={potion ? "secondary" : "ghost"}
                  disabled={!potion}
                  onClick={() => usePotion(idx)}
                  className="justify-between whitespace-nowrap"
                >
                  <span className="truncate">
                    {potion ? t(potion.nameKey) : t("potionEmpty")}
                  </span>
                  {potion?.count !== undefined && (
                    <Badge variant="amber">x{potion.count}</Badge>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card variant="subtle">
            <CardHeader>
              <CardTitle>{t("backpack")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {isBackpackEmpty ? (
                <Paragraph size="xs" variant="muted" className="py-6 text-center">
                  {t("backpackEmptyState")}
                </Paragraph>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {backpackItems.map((item, idx) => {
                    const isSelected =
                      inspectedItem?.source === "backpack" && inspectedItem.index === idx;
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg border flex flex-col justify-between gap-2 min-h-[82px] transition-colors ${
                          isSelected
                            ? "border-amber-400 bg-amber-950/30"
                            : "border-stone-800 bg-black/40"
                        }`}
                      >
                        {item ? (
                          <>
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setSelectedRef({ source: "backpack", index: idx, item })
                                }
                                className="h-auto p-0 justify-start text-left text-[11px] font-semibold text-amber-100 hover:text-amber-300"
                              >
                                <span className="line-clamp-2">{t(item.nameKey)}</span>
                              </Button>
                              <Badge variant={getRarityBadgeVariant(item.rarity)}>
                                {t(getRarityLabelKey(item.rarity))}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => equipItem(idx)}
                                className="h-6 px-2 text-[10px] flex-1 whitespace-nowrap"
                              >
                                {item.type === "potion" ? t("useItem") : t("equipItem")}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPendingDiscardIndex(idx)}
                                className="h-6 px-1.5 shrink-0"
                                aria-label={t("discardItem")}
                              >
                                <Trash2 size={11} />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <Text size="2xs" variant="muted" className="m-auto">
                            —
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selected Item Details Card */}
              {inspectedItem && (
                <div className="p-3 rounded-xl border border-amber-500/40 bg-stone-950/80 flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-400" />
                      <Text size="sm" weight="bold" className="text-amber-200">
                        {t(inspectedItem.item.nameKey)}
                      </Text>
                      <Badge variant={getRarityBadgeVariant(inspectedItem.item.rarity)}>
                        {t(getRarityLabelKey(inspectedItem.item.rarity))}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {inspectedItem.source === "backpack" ? (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => equipItem(inspectedItem.index)}
                            className="whitespace-nowrap shrink-0"
                          >
                            {inspectedItem.item.type === "potion"
                              ? t("useItem")
                              : t("equipItem")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<Trash2 size={12} />}
                            onClick={() => setPendingDiscardIndex(inspectedItem.index)}
                            className="whitespace-nowrap shrink-0"
                          >
                            {t("discardItem")}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => unequipItem(inspectedItem.slot)}
                          className="whitespace-nowrap shrink-0"
                        >
                          {t("unequipItem")}
                        </Button>
                      )}
                    </div>
                  </div>
                  {inspectedItem.item.descriptionKey && (
                    <Paragraph size="xs" variant="muted">
                      {t(inspectedItem.item.descriptionKey)}
                    </Paragraph>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {inspectedItem.item.attackBonus ? (
                      <Badge variant="amber">
                        +{inspectedItem.item.attackBonus} {t("itemAttackBonus")}
                      </Badge>
                    ) : null}
                    {inspectedItem.item.defenseBonus ? (
                      <Badge variant="cyan">
                        +{inspectedItem.item.defenseBonus} {t("itemDefenseBonus")}
                      </Badge>
                    ) : null}
                    {inspectedItem.item.maxHpBonus ? (
                      <Badge variant="green">
                        +{inspectedItem.item.maxHpBonus} {t("itemHpBonus")}
                      </Badge>
                    ) : null}
                    {inspectedItem.item.maxManaBonus ? (
                      <Badge variant="cyan">
                        +{inspectedItem.item.maxManaBonus} {t("itemManaBonus")}
                      </Badge>
                    ) : null}
                    {inspectedItem.item.healHp ? (
                      <Badge variant="green">
                        +{inspectedItem.item.healHp} {t("itemHealHp")}
                      </Badge>
                    ) : null}
                    {inspectedItem.item.healMana ? (
                      <Badge variant="cyan">
                        +{inspectedItem.item.healMana} {t("itemHealMana")}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingDiscardIndex !== null}
        onClose={() => setPendingDiscardIndex(null)}
        onConfirm={() => {
          if (pendingDiscardIndex !== null) discardItem(pendingDiscardIndex);
          setPendingDiscardIndex(null);
        }}
        title={t("discardConfirmTitle")}
        message={t("discardConfirmMessage")}
        confirmLabel={t("discardConfirmLabel")}
        cancelLabel={t("confirmCancelBtn")}
      />
    </div>
  );
};

InventoryModalView.displayName = "InventoryModalView";
export default InventoryModalView;
