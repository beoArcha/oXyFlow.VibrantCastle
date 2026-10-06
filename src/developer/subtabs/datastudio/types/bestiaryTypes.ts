import { EnemyJsonSchema } from "@lib/schemas/enemySchema";

export type BestiaryCategoryFilter =
  | "all"
  | "standard"
  | "beast"
  | "boss"
  | "aerial"
  | "dummy";

export type BestiarySortKey = "name" | "hp" | "attack" | "speed";
export type BestiarySortOrder = "asc" | "desc";

export interface BestiaryFilterState {
  searchQuery: string;
  category: string;
  aerialOnly: boolean;
  sortBy: BestiarySortKey;
  sortOrder: BestiarySortOrder;
}

export const DEFAULT_BESTIARY_FILTERS: BestiaryFilterState = {
  searchQuery: "",
  category: "all",
  aerialOnly: false,
  sortBy: "name",
  sortOrder: "asc",
};

/**
 * Pure filter and sort utility for monster bestiary collections.
 */
export function filterAndSortBestiaryEntries(
  enemies: readonly EnemyJsonSchema[],
  filters: BestiaryFilterState
): EnemyJsonSchema[] {
  const query = filters.searchQuery.trim().toLowerCase();

  const filtered = enemies.filter((enemy) => {
    if (
      query &&
      !enemy.id.toLowerCase().includes(query) &&
      !enemy.defaultName.toLowerCase().includes(query) &&
      !enemy.nameKey.toLowerCase().includes(query)
    ) {
      return false;
    }

    if (filters.category !== "all") {
      if (enemy.category.toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
    }

    if (filters.aerialOnly && !enemy.isAerial) {
      return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    let comparison = 0;
    switch (filters.sortBy) {
      case "hp":
        comparison = (a.stats?.health ?? 0) - (b.stats?.health ?? 0);
        break;
      case "attack":
        comparison = (a.stats?.attackPower ?? 0) - (b.stats?.attackPower ?? 0);
        break;
      case "speed":
        comparison = (a.stats?.speed ?? 0) - (b.stats?.speed ?? 0);
        break;
      case "name":
      default:
        comparison = a.defaultName.localeCompare(b.defaultName);
        break;
    }

    return filters.sortOrder === "desc" ? -comparison : comparison;
  });
}
