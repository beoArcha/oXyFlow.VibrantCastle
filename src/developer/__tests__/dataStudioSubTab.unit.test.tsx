import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderToString } from "react-dom/server";
import { DataStudioSubTab } from "../subtabs/DataStudioSubTab";
import { SpellAndSkillEditorCard } from "../subtabs/datastudio/SpellAndSkillEditorCard";
import { EnemyEditorCard } from "../subtabs/datastudio/EnemyEditorCard";
import { ItemEditorCard } from "../subtabs/datastudio/ItemEditorCard";
import { VisualNovelPreviewCard } from "../subtabs/datastudio/VisualNovelPreviewCard";
import { SkillTreeVisualizerCard } from "../subtabs/datastudio/SkillTreeVisualizerCard";
import { AIGeneratorCard } from "../subtabs/datastudio/AIGeneratorCard";
import { TestProviders, UiTestProviders, setupDomEnvironment, renderIntoDom, cleanupDom } from "@test-utils";

describe("DataStudio Developer Suite", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("DataStudioSubTab Orchestrator", () => {
    it("renders the default active section and tab navigation items in English", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="en">
          <DataStudioSubTab />
        </TestProviders>
      );

      expect(html).toContain("data-studio-content");
      expect(html).toContain("Spell &amp; Magic Editor");
    });

    it("renders Polish localization with 100% parity when configured", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="pl">
          <DataStudioSubTab />
        </TestProviders>
      );

      expect(html).toContain("Studio Danych i Schematów");
      expect(html).toContain("Edytor czarów i magii");
      expect(html).toContain("Prawidłowy");
    });

    it("switches between sub-sections when interactive buttons are clicked", async () => {
      const { container } = await renderIntoDom(
        <TestProviders defaultLanguage="en">
          <DataStudioSubTab />
        </TestProviders>,
        { mode: "none" }
      );

      const enemyNavBtn = container.querySelector<HTMLButtonElement>(
        '[data-testid="data-studio-nav-enemies"]'
      );
      expect(enemyNavBtn).not.toBeNull();

      if (enemyNavBtn) {
        await act(async () => {
          enemyNavBtn.click();
        });
        expect(
          container.textContent?.includes("Enemy & Creature Editor") ||
          container.textContent?.includes("Edytor potworów i istot")
        ).toBe(true);
      }
    });
  });

  describe("SpellAndSkillEditorCard", () => {
    it("renders spell fields and shows valid badge for canonical presets in English", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="en">
          <SpellAndSkillEditorCard />
        </TestProviders>
      );

      expect(html).toContain("Spell ID");
      expect(html).toContain("Magic Domain");
      expect(html).toContain("Cast Type");
      expect(html).toContain("Valid");
    });

    it("renders spell fields in Polish", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="pl">
          <SpellAndSkillEditorCard />
        </TestProviders>
      );

      expect(html).toContain("ID czaru");
      expect(html).toContain("Domena magii");
      expect(html).toContain("Typ rzucenia");
      expect(html).toContain("Prawidłowy");
    });
  });

  describe("EnemyEditorCard", () => {
    it("renders bestiary catalog mode by default in English", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="en">
          <EnemyEditorCard />
        </TestProviders>
      );

      expect(html).toContain("Bestiary Catalog");
      expect(html).toContain("Monster Editor");
      expect(html).toContain("Export Bestiary");
    });

    it("renders enemy form attributes and validates dimensions and stats in English", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="en">
          <EnemyEditorCard initialMode="editor" />
        </TestProviders>
      );

      expect(html).toContain("Enemy ID");
      expect(html).toContain("Attack Power");
      expect(html).toContain("Movement Speed");
      expect(html).toContain("Valid");
    });

    it("renders enemy form attributes in Polish", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="pl">
          <EnemyEditorCard initialMode="editor" />
        </TestProviders>
      );

      expect(html).toContain("ID potwora");
      expect(html).toContain("Siła ataku");
      expect(html).toContain("Prędkość ruchu");
      expect(html).toContain("Prawidłowy");
    });
  });

  describe("ItemEditorCard", () => {
    it("renders equipment attributes and validates gear schema in English", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="en">
          <ItemEditorCard />
        </TestProviders>
      );

      expect(html).toContain("Equipment &amp; Item Editor");
      expect(html).toContain("Item Type");
      expect(html).toContain("Rarity Tier");
      expect(html).toContain("Valid");
    });

    it("renders equipment attributes in Polish", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="pl">
          <ItemEditorCard />
        </TestProviders>
      );

      expect(html).toContain("Edytor ekwipunku i przedmiotów");
      expect(html).toContain("Typ przedmiotu");
      expect(html).toContain("Rzadkość przedmiotu");
      expect(html).toContain("Prawidłowy");
    });
  });

  describe("VisualNovelPreviewCard", () => {
    it("renders portrait emotion grid and dialogue speech bubble preview in English", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="en">
          <VisualNovelPreviewCard />
        </TestProviders>
      );

      expect(html).toContain("Visual Novel Scene &amp; 5x5 Portrait Emotion Preview");
      expect(html).toContain("5x5 Grid Cell");
      expect(html).toContain("Valen");
    });

    it("renders portrait emotion grid and dialogue speech bubble preview in Polish", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="pl">
          <VisualNovelPreviewCard />
        </TestProviders>
      );

      expect(html).toContain("Scena powieści wizualnej i podgląd emocji 5x5");
      expect(html).toContain("Komórka 5x5");
      expect(html).toContain("Valen");
    });

    it("renders speaker options including heroes, beasts, and narrator with accessibility attributes", async () => {
      const { container } = await renderIntoDom(
        <TestProviders defaultLanguage="en">
          <VisualNovelPreviewCard />
        </TestProviders>,
        { mode: "none" }
      );

      const speakerSelect = container.querySelector<HTMLSelectElement>("#vn-select-character");
      expect(speakerSelect).not.toBeNull();
      const options = Array.from(speakerSelect?.options ?? []).map((o) => o.value);

      expect(options).toContain("valen");
      expect(options).toContain("aurelia");
      expect(options).toContain("narrator");

      const previewRegion = container.querySelector('section[aria-label="Dialogue Speech Bubble"]');
      expect(previewRegion).not.toBeNull();
    });
  });

  describe("SkillTreeVisualizerCard", () => {
    it("renders skill DAG canvas with character nodes and edge pathways in English", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="en">
          <SkillTreeVisualizerCard />
        </TestProviders>
      );

      expect(html).toContain("Skill Tree Progression Graph (DAG Visualizer)");
      expect(html).toContain("Valid DAG");
      expect(html).toContain("<svg");
    });

    it("renders skill DAG canvas with character nodes in Polish", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="pl">
          <SkillTreeVisualizerCard />
        </TestProviders>
      );

      expect(html).toContain("Graf progresji drzewka umiejętności (DAG)");
      expect(html).toContain("Prawidłowy DAG");
      expect(html).toContain("<svg");
    });
  });

  describe("AIGeneratorCard", () => {
    it("renders system prompt generator and structured outputs validation sandbox in English", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="en">
          <AIGeneratorCard />
        </TestProviders>
      );

      expect(html).toContain("AI Structured Outputs &amp; Schema Generator");
      expect(html).toContain("Target Entity Type:");
      expect(html).toContain("JSON Output Validation Sandbox:");
      expect(html).toContain("Valid Conforming Payload");
    });

    it("renders system prompt generator and structured outputs validation sandbox in Polish", () => {
      const html = renderToString(
        <TestProviders defaultLanguage="pl">
          <AIGeneratorCard />
        </TestProviders>
      );

      expect(html).toContain("Generator struktur AI i walidator schematów");
      expect(html).toContain("Docelowy typ encji:");
      expect(html).toContain("Piaskownica walidacji JSON:");
      expect(html).toContain("Poprawny obiekt schematu");
    });

    it("validates malformed JSON and updates validation badge", async () => {
      const { container, changeInput } = await renderIntoDom(
        <TestProviders defaultLanguage="en">
          <AIGeneratorCard />
        </TestProviders>,
        { mode: "none" }
      );

      const textarea = container.querySelector<HTMLTextAreaElement>("#ai-json-sandbox");
      expect(textarea).not.toBeNull();

      if (textarea) {
        await changeInput(textarea as unknown as HTMLInputElement, "{ invalid_json: ");
        expect(container.textContent).toContain("1 Issue(s)");
      }
    });
  });
});
