import type { EquipmentSlotKey, GridDirection, InventorySelection } from "./types";

export const BACKPACK_GRID_COLUMNS = 8;
export const BACKPACK_CAPACITY = 16;
export const BELT_CAPACITY = 3;

export const PAPERDOLL_NAV_ORDER: readonly EquipmentSlotKey[] = [
  "amulet",
  "helmet",
  "ring",
  "mainHand",
  "offHand",
  "armor",
];

type NavSelection = Exclude<InventorySelection, { readonly kind: "none" }>;

const VERTICAL_DOWN_MAP: Record<string, NavSelection> = {
  "equipment:amulet": { kind: "equipment", slot: "mainHand" },
  "equipment:helmet": { kind: "equipment", slot: "armor" },
  "equipment:ring": { kind: "equipment", slot: "offHand" },
  "equipment:mainHand": { kind: "potion", index: 0 },
  "equipment:armor": { kind: "potion", index: 1 },
  "equipment:offHand": { kind: "potion", index: 2 },
};

const VERTICAL_UP_MAP: Record<string, NavSelection> = {
  "equipment:mainHand": { kind: "equipment", slot: "amulet" },
  "equipment:armor": { kind: "equipment", slot: "helmet" },
  "equipment:offHand": { kind: "equipment", slot: "ring" },
  "potion:0": { kind: "equipment", slot: "mainHand" },
  "potion:1": { kind: "equipment", slot: "armor" },
  "potion:2": { kind: "equipment", slot: "offHand" },
};

/**
 * Returns a stable DOM/map identifier for an inventory slot selection.
 */
export function getSelectionKey(selection: InventorySelection): string {
  if (selection.kind === "equipment") return `equipment:${selection.slot}`;
  if (selection.kind === "potion") return `potion:${selection.index}`;
  if (selection.kind === "backpack") return `backpack:${selection.index}`;
  return "none";
}

function buildNavSequence(hasBackpackSlots: boolean): NavSelection[] {
  const seq: NavSelection[] = [
    ...PAPERDOLL_NAV_ORDER.map((slot) => ({ kind: "equipment" as const, slot })),
    ...Array.from({ length: BELT_CAPACITY }, (_, index) => ({ kind: "potion" as const, index })),
  ];
  if (hasBackpackSlots) {
    for (let index = 0; index < BACKPACK_CAPACITY; index++) {
      seq.push({ kind: "backpack", index });
    }
  }
  return seq;
}

function stepHorizontal(
  current: InventorySelection,
  delta: -1 | 1,
  hasBackpackSlots: boolean
): NavSelection {
  const sequence = buildNavSequence(hasBackpackSlots);
  if (current.kind === "none") {
    return delta > 0 ? sequence[0] : sequence[sequence.length - 1];
  }
  const currentKey = getSelectionKey(current);
  const idx = sequence.findIndex((entry) => getSelectionKey(entry) === currentKey);
  if (idx === -1) return sequence[0];
  return sequence[(idx + delta + sequence.length) % sequence.length];
}

function stepVerticalDown(current: InventorySelection, hasBackpackSlots: boolean): NavSelection {
  if (current.kind === "none") return { kind: "equipment", slot: "amulet" };

  const key = getSelectionKey(current);
  const mapped = VERTICAL_DOWN_MAP[key];
  if (mapped) return mapped;

  if (current.kind === "potion") {
    if (hasBackpackSlots) return { kind: "backpack", index: current.index };
    const wrapSlots: readonly EquipmentSlotKey[] = ["amulet", "helmet", "ring"];
    return { kind: "equipment", slot: wrapSlots[current.index] ?? "amulet" };
  }

  if (current.kind === "backpack") {
    const nextIdx = current.index + BACKPACK_GRID_COLUMNS;
    if (nextIdx < BACKPACK_CAPACITY) return { kind: "backpack", index: nextIdx };
    const col = current.index % BACKPACK_GRID_COLUMNS;
    const topSlots: readonly EquipmentSlotKey[] = ["amulet", "helmet", "ring"];
    return { kind: "equipment", slot: topSlots[Math.min(col, 2)] };
  }

  return { kind: "equipment", slot: "amulet" };
}

function stepVerticalUp(current: InventorySelection, hasBackpackSlots: boolean): NavSelection {
  if (current.kind === "none") {
    return hasBackpackSlots ? { kind: "backpack", index: BACKPACK_CAPACITY - 1 } : { kind: "potion", index: 2 };
  }

  const key = getSelectionKey(current);
  const mapped = VERTICAL_UP_MAP[key];
  if (mapped) return mapped;

  if (current.kind === "backpack") {
    const prevIdx = current.index - BACKPACK_GRID_COLUMNS;
    if (prevIdx >= 0) return { kind: "backpack", index: prevIdx };
    return { kind: "potion", index: Math.min(current.index, BELT_CAPACITY - 1) };
  }

  if (current.kind === "equipment") {
    const colMap: Partial<Record<EquipmentSlotKey, number>> = { amulet: 0, helmet: 1, ring: 2 };
    const col = colMap[current.slot] ?? 0;
    return hasBackpackSlots
      ? { kind: "backpack", index: BACKPACK_GRID_COLUMNS + col }
      : { kind: "potion", index: col };
  }

  return { kind: "equipment", slot: "amulet" };
}

/**
 * Computes the next slot selection for an arrow key / D-pad step across
 * paperdoll -> quick belt -> backpack in predictable grid order.
 */
export function moveInventorySelection(
  current: InventorySelection,
  direction: GridDirection,
  hasBackpackSlots: boolean = true
): NavSelection {
  if (direction === "right") return stepHorizontal(current, 1, hasBackpackSlots);
  if (direction === "left") return stepHorizontal(current, -1, hasBackpackSlots);
  if (direction === "down") return stepVerticalDown(current, hasBackpackSlots);
  return stepVerticalUp(current, hasBackpackSlots);
}
