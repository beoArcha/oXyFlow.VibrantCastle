import React from "react";
import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { TestProviders } from "@test-utils";
import { DebugSubtab } from "../subtabs/debug/DebugSubtab";

describe("DebugSubtab", () => {
  it("should render the developer telemetry workspace when its providers are available", () => {
    // Arrange
    const providers = (children: React.ReactNode) => (
      <TestProviders>{children}</TestProviders>
    );

    // Act
    const html = renderToString(providers(<DebugSubtab />));

    // Assert
    expect(html).toContain('id="subtab-content-debug"');
    expect(html).toContain("FPS");
  });
});
