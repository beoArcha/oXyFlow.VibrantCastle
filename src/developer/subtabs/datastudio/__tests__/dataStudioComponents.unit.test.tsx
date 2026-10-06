import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderToString } from "react-dom/server";
import { SchemaValidationAlert } from "../components/SchemaValidationAlert";
import { SchemaValidationBadge } from "../components/SchemaValidationBadge";
import { PresetSelectorHeader } from "../components/PresetSelectorHeader";
import { ExportToolbar } from "../components/ExportToolbar";
import { JsonExportModal } from "../components/JsonExportModal";
import { BestiaryCardItem } from "../components/bestiary/BestiaryCardItem";
import { BestiaryGalleryView } from "../components/bestiary/BestiaryGalleryView";
import { BestiaryEntryInspector } from "../components/bestiary/BestiaryEntryInspector";
import { BestiaryFilters } from "../components/bestiary/BestiaryFilters";
import { EnemyJsonSchema } from "@lib/schemas/enemySchema";
import { DEFAULT_BESTIARY_FILTERS } from "../types/bestiaryTypes";
import { UiTestProviders, setupDomEnvironment, cleanupDom } from "@test-utils";

describe("DataStudio Reusable UI Components", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("SchemaValidationBadge", () => {
    it("renders valid status with accessible role in English", () => {
      const html = renderToString(
        <UiTestProviders defaultLanguage="en">
          <SchemaValidationBadge isValid={true} errorCount={0} />
        </UiTestProviders>
      );

      expect(html).toContain('role="status"');
      expect(html).toContain("Valid");
    });

    it("renders error count with accessible role in Polish", () => {
      const html = renderToString(
        <UiTestProviders defaultLanguage="pl">
          <SchemaValidationBadge isValid={false} errorCount={3} />
        </UiTestProviders>
      );

      expect(html).toContain('role="status"');
      expect(html).toContain("3");
      expect(html).toContain("błędów");
    });
  });

  describe("SchemaValidationAlert", () => {
    it("returns null when errors array is empty", () => {
      const html = renderToString(
        <UiTestProviders defaultLanguage="en">
          <SchemaValidationAlert errors={[]} />
        </UiTestProviders>
      );

      expect(html).toBe("");
    });

    it("renders accessible alert role and formatted errors list", () => {
      const sampleErrors = [
        { path: "stats.speed", message: "Speed must be positive" },
        { path: "color", message: "Invalid hex format" },
      ];

      const html = renderToString(
        <UiTestProviders defaultLanguage="en">
          <SchemaValidationAlert errors={sampleErrors} />
        </UiTestProviders>
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain("stats.speed");
      expect(html).toContain("Speed must be positive");
      expect(html).toContain("color");
      expect(html).toContain("Invalid hex format");
    });
  });

  describe("PresetSelectorHeader", () => {
    it("renders select dropdown and create button with accessible labels", () => {
      const options = [
        { value: "preset_1", label: "Preset One" },
        { value: "preset_2", label: "Preset Two" },
      ];

      const html = renderToString(
        <UiTestProviders defaultLanguage="en">
          <PresetSelectorHeader
            label="Choose Spell"
            selectedValue="preset_1"
            onSelect={() => {}}
            options={options}
            createButtonLabel="Add New"
            onCreateNew={() => {}}
          />
        </UiTestProviders>
      );

      expect(html).toContain("Choose Spell");
      expect(html).toContain("Preset One");
      expect(html).toContain("Add New");
    });
  });

  describe("ExportToolbar & JsonExportModal", () => {
    it("renders export button in toolbar", () => {
      const html = renderToString(
        <UiTestProviders defaultLanguage="en">
          <ExportToolbar
            data={{ test: 123 }}
            filename="test.json"
          />
        </UiTestProviders>
      );

      expect(html).toContain("Export JSON");
    });

    it("renders modal content when open", () => {
      const html = renderToString(
        <UiTestProviders defaultLanguage="en">
          <JsonExportModal
            isOpen={true}
            usePortal={false}
            onClose={() => {}}
            data={{ spellId: "solar_flare", damage: 50 }}
            filename="solar_flare.json"
          />
        </UiTestProviders>
      );

      expect(html).toContain("solar_flare.json");
      expect(html).toContain("Download File (.json)");
    });
  });

  describe("Bestiary Components", () => {
    const mockEnemy: EnemyJsonSchema = {
      id: "clockwork_sentinel",
      nameKey: "monsterClockworkSentinel",
      defaultName: "Clockwork Sentinel",
      category: "boss",
      isDummy: false,
      isAerial: false,
      dimensions: { width: 64, height: 80 },
      stats: {
        health: 800,
        maxHealth: 800,
        speed: 1.5,
        attackPower: 45,
        scoreReward: 1200,
      },
      proceduralFallback: {
        bodyColor: "#78350f",
        accentColor: "#f59e0b",
        eyesColor: "#ef4444",
      },
      soulDrop: {
        soulId: "soul_clockwork_sentinel",
        type: "guardian",
        dropRate: 0.25,
        grantedSkillId: "clockwork_barrier",
        icon: "Shield",
        i18n: {
          nameKey: "soulClockworkSentinelName",
          descriptionKey: "soulClockworkSentinelDesc",
        },
      },
      elementalResistances: {
        physical: 0.2,
        fire: -0.3,
      },
    };

    it("renders BestiaryCardItem with enemy identity, stats, and badges", () => {
      const html = renderToString(
        <UiTestProviders defaultLanguage="en">
          <BestiaryCardItem
            enemy={mockEnemy}
            isSelected={false}
            onSelect={() => {}}
          />
        </UiTestProviders>
      );

      expect(html).toContain("Clockwork Sentinel");
      expect(html).toContain("clockwork_sentinel");
      expect(html).toContain("boss");
      expect(html).toContain("800");
      expect(html).toContain("45");
      expect(html).toContain("guardian");
    });

    it("renders BestiaryGalleryView with empty state when no items match", () => {
      const html = renderToString(
        <UiTestProviders defaultLanguage="en">
          <BestiaryGalleryView
            enemies={[]}
            onSelectEnemy={() => {}}
          />
        </UiTestProviders>
      );

      expect(html).toContain("No monsters found");
    });

    it("renders BestiaryEntryInspector with full combat stats, resistances, and soul drop", () => {
      const html = renderToString(
        <UiTestProviders defaultLanguage="pl">
          <BestiaryEntryInspector
            enemy={mockEnemy}
            onOpenInEditor={() => {}}
          />
        </UiTestProviders>
      );

      expect(html).toContain("Clockwork Sentinel");
      expect(html).toContain("64");
      expect(html).toContain("80");
      expect(html).toContain("px");
      expect(html).toContain("800");
      expect(html).toContain("guardian");
      expect(html).toContain("clockwork_barrier");
      expect(html).toContain("physical");
      expect(html).toContain("+20%");
      expect(html).toContain("Edytuj w Edytorze");
    });

    it("renders BestiaryFilters with search bar and category selector", () => {
      const html = renderToString(
        <UiTestProviders defaultLanguage="en">
          <BestiaryFilters
            filters={DEFAULT_BESTIARY_FILTERS}
            onFilterChange={() => {}}
            availableCategories={["standard", "boss", "aerial"]}
          />
        </UiTestProviders>
      );

      expect(html).toContain("Search monster");
      expect(html).toContain("boss");
      expect(html).toContain("aerial");
    });
  });
});

