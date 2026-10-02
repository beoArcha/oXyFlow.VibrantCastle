import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import { Activity, Code } from "lucide-react";
import { MetricTile, CopyableSnippet } from "../index";
import { setupDomEnvironment, renderIntoDom, cleanupDom } from "@test-utils";

describe("MetricTile & CopyableSnippet UI Components", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("MetricTile", () => {
    it("renders label, value, subtext and icon correctly", () => {
      const html = renderToString(
        <MetricTile
          icon={<Activity size={14} />}
          label="Engine FPS"
          value="60"
          subtext="target: 60"
          variant="emerald"
        />
      );

      expect(html).toContain("Engine FPS");
      expect(html).toContain("60");
      expect(html).toContain("target: 60");
      expect(html).toContain("text-emerald-300");
    });

    it("renders different color variants cleanly", () => {
      const variants = ["amber", "rose", "cyan", "purple", "blue", "stone"] as const;
      for (const variant of variants) {
        const html = renderToString(
          <MetricTile label="Stat" value="100" variant={variant} />
        );
        expect(html).toContain(`text-${variant}-300`);
      }
    });

    it("supports compact mode with smaller padding and text", () => {
      const html = renderToString(
        <MetricTile label="Compact Metric" value="42" compact={true} />
      );
      expect(html).toContain("p-2");
      expect(html).toContain("text-sm");
    });
  });

  describe("CopyableSnippet", () => {
    it("renders formatted monospace text and header", () => {
      const html = renderToString(
        <CopyableSnippet
          title="State Dump"
          icon={<Code size={14} />}
          text='{ "status": "active" }'
        />
      );

      expect(html).toContain("State Dump");
      expect(html).toContain("status");
      expect(html).toContain("active");
      expect(html).toContain("Copy");
    });

    it("interactively copies text to navigator.clipboard and updates state", async () => {
      let writtenText = "";
      let successCalled = false;

      // Mock navigator.clipboard via Object.defineProperty
      Object.defineProperty(window.navigator, "clipboard", {
        value: {
          writeText: async (t: string) => {
            writtenText = t;
          },
        },
        configurable: true,
        writable: true,
      });

      const { container, click } = await renderIntoDom(
        <CopyableSnippet
          title="Telemetry JSON"
          text='{"fps": 60}'
          copyLabel="Copy JSON"
          copiedLabel="Copied Successfully!"
          onCopySuccess={() => {
            successCalled = true;
          }}
        />
      );

      const copyBtn = container.querySelector("button");
      expect(copyBtn).toBeDefined();
      expect(copyBtn?.textContent).toContain("Copy JSON");

      if (copyBtn) await click(copyBtn);

      expect(writtenText).toBe('{"fps": 60}');
      expect(successCalled).toBe(true);
      expect(copyBtn?.textContent).toContain("Copied Successfully!");
    });

    it("handles clipboard failure gracefully via onCopyError", async () => {
      let errorCaptured: unknown = null;

      Object.defineProperty(window.navigator, "clipboard", {
        value: {
          writeText: async () => {
            throw new Error("Clipboard permission denied");
          },
        },
        configurable: true,
        writable: true,
      });

      const { container, click } = await renderIntoDom(
        <CopyableSnippet
          text="secret data"
          onCopyError={(err) => {
            errorCaptured = err;
          }}
        />
      );

      const copyBtn = container.querySelector("button");
      if (copyBtn) await click(copyBtn);

      expect(errorCaptured).toBeDefined();
      expect((errorCaptured as Error).message).toBe("Clipboard permission denied");
    });
  });
});
