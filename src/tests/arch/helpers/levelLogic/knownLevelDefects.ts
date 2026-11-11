export interface KnownDefect {
  code: string;
  subject: string;
}

/**
 * ERRORs that exist in the shipped maps today. The architecture test fails on any ERROR missing from
 * this list and on any entry that no longer occurs, so fix the map and delete the entry together.
 * Check progress with `bun scripts/validate-level.ts <locationId>`.
 */
export const KNOWN_LEVEL_DEFECTS: Readonly<Record<string, readonly KnownDefect[]>> = {
  aether_sanctuary: [],
  clocktower: [],
  courtyard: [],
  grand_bastion: [],
  thorn_chasm: [],
};
