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
  courtyard: [
    { code: "SPAWN_INVALID", subject: "spawn:from_tower" },
    { code: "SPAWN_INVALID", subject: "spawn:from_tower+p2" },
    { code: "UNREACHABLE_PLATFORM", subject: "court_secret_ledge_1" },
    { code: "UNREACHABLE_PLATFORM", subject: "court_high_roost" },
    { code: "UNREACHABLE_PLATFORM", subject: "court_gate_parapet" },
    { code: "UNREACHABLE_PLATFORM", subject: "court_secret_arch_1" },
    { code: "UNREACHABLE_PLATFORM", subject: "court_secret_vault_terrace" },
    { code: "UNREACHABLE_PLATFORM", subject: "court_end_arch" },
    { code: "TRIGGER_UNREACHABLE", subject: "trigger_secret_vault" },
  ],
  grand_bastion: [],
  thorn_chasm: [
    // Sentinel feet sit 5px above the floor, one pixel past the 4px air tolerance.
    { code: "ENEMY_FLOATING", subject: "chasm_crawler" },
  ],
};
