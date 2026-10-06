import { describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  useSettings,
  useSaveGame,
  useI18n,
  useInventory,
  useSkills,
  useGameSession,
  GameProvider,
  I18nProvider,
} from "../index";
import {
  MissingContextProviderError,
  ErrorCode,
  EngineError,
} from "@lib/errors";
import { GameErrorBoundary } from "@ui";
import { LoggerManager, LogLevel, ILogTransport, LogRecord } from "@lib/logger";

describe("React Context Safety & ErrorBoundary", () => {
  let records: LogRecord[] = [];
  let testTransport: ILogTransport;
  let manager: LoggerManager;

  beforeEach(() => {
    records = [];
    testTransport = {
      name: "TestTransport",
      write: (r) => records.push(r),
    };
    manager = LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
      transports: [testTransport],
    });
  });

  const renderWithHook = (hook: () => unknown) => {
    const Component: React.FC = () => {
      hook();
      return null;
    };
    renderToString(React.createElement(Component));
  };

  describe("MissingContextProviderError on Orphaned Context Hooks", () => {
    it("throws MissingContextProviderError when useSettings is used outside SettingsProvider", () => {
      expect(() => renderWithHook(useSettings)).toThrow(MissingContextProviderError);
      try {
        renderWithHook(useSettings);
      } catch (err: any) {
        expect(err).toBeInstanceOf(MissingContextProviderError);
        expect(err.code).toBe(ErrorCode.REACT_MISSING_CONTEXT);
        expect(err.domain).toBe("REACT");
        expect(err.hookName).toBe("useSettings");
        expect(err.providerName).toBe("SettingsProvider");
        expect(err.message).toContain('Hook "useSettings" must be used within a <SettingsProvider />');
      }
    });

    it("throws MissingContextProviderError when useSaveGame is used outside SaveGameProvider", () => {
      expect(() => renderWithHook(useSaveGame)).toThrow(MissingContextProviderError);
      try {
        renderWithHook(useSaveGame);
      } catch (err: any) {
        expect(err).toBeInstanceOf(MissingContextProviderError);
        expect(err.code).toBe(ErrorCode.REACT_MISSING_CONTEXT);
        expect(err.domain).toBe("REACT");
        expect(err.hookName).toBe("useSaveGame");
        expect(err.providerName).toBe("SaveGameProvider");
      }
    });

    it("throws MissingContextProviderError when useI18n is used outside I18nProvider", () => {
      expect(() => renderWithHook(useI18n)).toThrow(MissingContextProviderError);
      try {
        renderWithHook(useI18n);
      } catch (err: any) {
        expect(err).toBeInstanceOf(MissingContextProviderError);
        expect(err.code).toBe(ErrorCode.REACT_MISSING_CONTEXT);
        expect(err.domain).toBe("REACT");
        expect(err.hookName).toBe("useI18n");
        expect(err.providerName).toBe("I18nProvider");
      }
    });

    it("throws MissingContextProviderError when useInventory is used outside InventoryProvider", () => {
      expect(() => renderWithHook(useInventory)).toThrow(MissingContextProviderError);
      try {
        renderWithHook(useInventory);
      } catch (err: any) {
        expect(err).toBeInstanceOf(MissingContextProviderError);
        expect(err.code).toBe(ErrorCode.REACT_MISSING_CONTEXT);
        expect(err.domain).toBe("REACT");
        expect(err.hookName).toBe("useInventory");
        expect(err.providerName).toBe("InventoryProvider");
      }
    });

    it("throws MissingContextProviderError when useSkills is used outside SkillsProvider", () => {
      expect(() => renderWithHook(useSkills)).toThrow(MissingContextProviderError);
      try {
        renderWithHook(useSkills);
      } catch (err: any) {
        expect(err).toBeInstanceOf(MissingContextProviderError);
        expect(err.code).toBe(ErrorCode.REACT_MISSING_CONTEXT);
        expect(err.domain).toBe("REACT");
        expect(err.hookName).toBe("useSkills");
        expect(err.providerName).toBe("SkillsProvider");
      }
    });

    it("throws MissingContextProviderError when useGameSession is used outside GameSessionProvider", () => {
      expect(() => renderWithHook(useGameSession)).toThrow(MissingContextProviderError);
      try {
        renderWithHook(useGameSession);
      } catch (err: any) {
        expect(err).toBeInstanceOf(MissingContextProviderError);
        expect(err.code).toBe(ErrorCode.REACT_MISSING_CONTEXT);
        expect(err.domain).toBe("REACT");
        expect(err.hookName).toBe("useGameSession");
        expect(err.providerName).toBe("GameSessionProvider");
      }
    });

    it("renders children cleanly within GameProvider hierarchy", () => {
      const html = renderToString(
        React.createElement(
          I18nProvider,
          null,
          React.createElement(
            GameProvider,
            null,
            React.createElement("div", { id: "test-child" }, "Child Content")
          )
        )
      );
      expect(html).toContain("test-child");
      expect(html).toContain("Child Content");
    });
  });

  describe("GameErrorBoundary with GameBaseError Integration", () => {
    it("handles GameBaseError in componentDidCatch and attaches log context with code and domain", () => {
      const boundaryLogger = manager.getLogger("component:error-boundary");
      const boundary = new GameErrorBoundary({
        children: null,
        logger: boundaryLogger,
      });

      const engineError = new EngineError(
        "Canvas 2D rendering context lost",
        ErrorCode.ENGINE_CANVAS_CONTEXT_LOST,
        {
          details: { width: 1920, height: 1080 },
        }
      );
      const errorInfo: React.ErrorInfo = {
        componentStack: "\n    in GameCanvas\n    in GameView\n    in App",
      };

      boundary.componentDidCatch(engineError, errorInfo);

      expect(records.length).toBe(1);
      const record = records[0];
      expect(record.level).toBe(LogLevel.FATAL);
      expect(record.category).toBe("component:error-boundary");
      expect(record.message).toContain("Canvas 2D rendering context lost");
      expect(record.error?.name).toBe("EngineError");
      expect(record.error?.code).toBe(ErrorCode.ENGINE_CANVAS_CONTEXT_LOST);
      expect(record.error?.domain).toBe("ENGINE");
      expect((record.error?.details as any)?.width).toBe(1920);
    });

    it("renders fallback UI with domain badges when GameBaseError is caught", () => {
      const boundary = new GameErrorBoundary({
        children: null,
      });

      const missingContextErr = new MissingContextProviderError("useSettings", "SettingsProvider");
      boundary.state = {
        hasError: true,
        error: missingContextErr,
        componentStack: "\n    in SettingsDialog\n    in App",
        copied: false,
      };

      const rendered = boundary.render() as React.ReactElement;
      expect(rendered).toBeDefined();
      const html = renderToString(rendered);
      expect(html).toContain('role="alert"');
      expect(html).toContain("[REACT]");
      expect(html).toContain(ErrorCode.REACT_MISSING_CONTEXT);
    });
  });
});
