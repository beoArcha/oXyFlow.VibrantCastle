import { describe, it, expect } from "bun:test";
import {
  TesterTeleportCard,
  TesterCheatsCard,
  TesterInventoryCard,
  TesterCombatCard,
  TesterTimeAndDiagnosticsCard,
  TesterParallaxCard,
  LOCATION_IDS,
  MONSTER_ID_LIST,
} from "../subtabs/tester";
import {
  LogsHeaderToolbar,
  LogsFilterControls,
  LogItemDrawer,
  LogsTerminalList,
} from "../subtabs/logs";
import { TesterSubTab } from "../subtabs/TesterSubTab";
import { LogsSubTab } from "../subtabs/LogsSubTab";

describe("Developer Suite Phase 3: Modular Decomposition of Tester & Logs", () => {
  it("verifies TesterSubTab orchestrator and all decomposed domain cards are defined", () => {
    expect(typeof TesterSubTab).toBe("function");
    expect(typeof TesterTeleportCard).toBe("function");
    expect(typeof TesterCheatsCard).toBe("function");
    expect(typeof TesterInventoryCard).toBe("function");
    expect(typeof TesterCombatCard).toBe("function");
    expect(typeof TesterTimeAndDiagnosticsCard).toBe("function");
    expect(typeof TesterParallaxCard).toBe("function");
  });

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

  it("verifies LogsSubTab orchestrator and decomposed logs components are defined", () => {
    expect(typeof LogsSubTab).toBe("function");
    expect(typeof LogsHeaderToolbar).toBe("function");
    expect(typeof LogsFilterControls).toBe("function");
    expect(typeof LogItemDrawer).toBe("function");
    expect(typeof LogsTerminalList).toBe("function");
  });
});
