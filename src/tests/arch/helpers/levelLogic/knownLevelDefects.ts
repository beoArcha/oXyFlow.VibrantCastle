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
  aether_sanctuary: [
    { code: "UNREACHABLE_PLATFORM", subject: "aether_crystal_plat_1" },
    { code: "UNREACHABLE_PLATFORM", subject: "aether_isle_2" },
    { code: "UNREACHABLE_PLATFORM", subject: "aether_lift_up" },
    { code: "UNREACHABLE_PLATFORM", subject: "aether_altar_isle" },
    { code: "LEVER_UNREACHABLE", subject: "aether_altar_lever" },
    { code: "PORTAL_UNREACHABLE", subject: "aether_goal_portal" },
  ],
  clocktower: [],
  courtyard: [],
  grand_bastion: [],
  thorn_chasm: [],
};
