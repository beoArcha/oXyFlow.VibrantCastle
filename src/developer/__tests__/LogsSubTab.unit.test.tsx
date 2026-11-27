import React from "react";
import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";
import { I18nProvider } from "@context/I18nContext";
import { LogsSubtab } from "../subtabs/logs/LogsSubtab";

describe("LogsSubtab", () => {
  it("should render the developer log workspace when localization is available", () => {
    // Arrange
    const workspace = (
      <I18nProvider>
        <LogsSubtab />
      </I18nProvider>
    );

    // Act
    const html = renderToString(workspace);

    // Assert
    expect(html).toContain('id="subtab-content-logs"');
  });
});
