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
import { TestProviders, setupDomEnvironment, renderIntoDom, cleanupDom } from "@test-utils";

describe("DataStudio Developer Suite", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("DataStudioSubTab Orchestrator", () => {
    it("renders the default active section and tab navigation items", () => {
      const html = renderToString(
        <TestProviders>
          <DataStudioSubTab />
        </TestProviders>
      );

      expect(html).toContain("data-studio-content");
      expect(html).toContain("Spell &amp; Magic Editor");
    });

    it("switches between sub-sections when interactive buttons are clicked", async () => {
      const { container } = await renderIntoDom(
        <TestProviders>
          <DataStudioSubTab />
        </TestProviders>
      );

      const enemyNavBtn = container.querySelector<HTMLButtonElement>(
        '[data-testid="data-studio-nav-enemies"]'
      );
      expect(enemyNavBtn).not.toBeNull();

      if (enemyNavBtn) {
        await act(async () => {
          enemyNavBtn.click();
        });
        expect(container.textContent).toContain("Enemy & Creature Editor");
      }
    });
  });

  describe("SpellAndSkillEditorCard", () => {
    it("renders spell fields and shows valid badge for canonical presets", () => {
      const html = renderToString(
        <TestProviders>
          <SpellAndSkillEditorCard />
        </TestProviders>
      );

      expect(html).toContain("Spell ID");
      expect(html).toContain("Magic Domain");
      expect(html).toContain("Cast Type");
      expect(html).toContain("Valid");
    });
  });

  describe("EnemyEditorCard", () => {
    it("renders enemy form attributes and validates dimensions and stats", () => {
      const html = renderToString(
        <TestProviders>
          <EnemyEditorCard />
        </TestProviders>
      );

      expect(html).toContain("Enemy ID");
      expect(html).toContain("Attack Power");
      expect(html).toContain("Speed");
      expect(html).toContain("Valid");
    });
  });

  describe("ItemEditorCard", () => {
    it("renders equipment attributes and validates gear schema", () => {
      const html = renderToString(
        <TestProviders>
          <ItemEditorCard />
        </TestProviders>
      );

      expect(html).toContain("Equipment &amp; Item Editor");
      expect(html).toContain("Item Type");
      expect(html).toContain("Rarity Tier");
      expect(html).toContain("Valid");
    });
  });

  describe("VisualNovelPreviewCard", () => {
    it("renders portrait emotion grid and dialogue speech bubble preview", () => {
      const html = renderToString(
        <TestProviders>
          <VisualNovelPreviewCard />
        </TestProviders>
      );

      expect(html).toContain("Visual Novel Scene &amp; 5x5 Portrait Emotion Preview");
      expect(html).toContain("5x5 Grid Cell");
      expect(html).toContain("Valen");
    });
  });

  describe("SkillTreeVisualizerCard", () => {
    it("renders skill DAG canvas with character nodes and edge pathways", () => {
      const html = renderToString(
        <TestProviders>
          <SkillTreeVisualizerCard />
        </TestProviders>
      );

      expect(html).toContain("Skill Tree Progression Graph (DAG Visualizer)");
      expect(html).toContain("Valid DAG");
      expect(html).toContain("<svg");
    });
  });

  describe("AIGeneratorCard", () => {
    it("renders system prompt generator and structured outputs validation sandbox", () => {
      const html = renderToString(
        <TestProviders>
          <AIGeneratorCard />
        </TestProviders>
      );

      expect(html).toContain("AI Structured Outputs &amp; Schema Generator");
      expect(html).toContain("Target Entity Type:");
      expect(html).toContain("JSON Output Validation Sandbox:");
      expect(html).toContain("Valid Conforming Payload");
    });
  });
});
