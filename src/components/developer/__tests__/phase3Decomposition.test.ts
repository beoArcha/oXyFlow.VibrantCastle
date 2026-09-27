import { describe, it, expect } from "bun:test";
import { LOCATION_IDS, MONSTER_ID_LIST } from "../subtabs/tester";

describe("Tester Module Configurations", () => {
  it("verifies LOCATION_IDS and MONSTER_ID_LIST configurations in tester module", () => {
    expect(LOCATION_IDS).toBeArray();
    expect(LOCATION_IDS.length).toBe(5);
    expect(LOCATION_IDS).toContain("courtyard");
    expect(LOCATION_IDS).toContain("grand_bastion");

    expect(MONSTER_ID_LIST).toBeArray();
    expect(MONSTER_ID_LIST.length).toBeGreaterThanOrEqual(5);
    expect(MONSTER_ID_LIST[0]).toHaveProperty("id");
    expect(MONSTER_ID_LIST[0]).toHaveProperty("translationKey");
  });
});
