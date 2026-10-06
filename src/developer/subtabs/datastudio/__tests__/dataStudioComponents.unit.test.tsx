import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderToString } from "react-dom/server";
import { SchemaValidationAlert } from "../components/SchemaValidationAlert";
import { SchemaValidationBadge } from "../components/SchemaValidationBadge";
import { PresetSelectorHeader } from "../components/PresetSelectorHeader";
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
});
