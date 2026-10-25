import { describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { GameErrorBoundary } from "@ui";
import { LoggerManager, LogLevel, ILogTransport, LogRecord } from "@lib/logger";
import { RingBufferTransport } from "@lib/logger/transports/RingBufferTransport";

describe("GameErrorBoundary Component", () => {
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

  describe("Lifecycle & Error Logging", () => {
    it("instantiates cleanly with injected logger", () => {
      const customLogger = manager.getLogger("component:test-boundary");
      const boundary = new GameErrorBoundary({
        children: null,
        logger: customLogger,
      });

      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.error).toBeNull();
    });

    it("updates state via getDerivedStateFromError", () => {
      const err = new Error("Test UI Render Explosion");
      const nextState = GameErrorBoundary.getDerivedStateFromError(err);

      expect(nextState.hasError).toBe(true);
      expect(nextState.error).toBe(err);
    });

    it("logs fatal error via ILogger in componentDidCatch with componentStack context", () => {
      const boundaryLogger = manager.getLogger("component:error-boundary");
      const boundary = new GameErrorBoundary({
        children: null,
        logger: boundaryLogger,
      });

      const simulatedError = new RangeError("Maximum call stack size exceeded in InventoryGrid");
      const simulatedErrorInfo: React.ErrorInfo = {
        componentStack: "\n    in InventoryGrid\n    in InventoryPanel\n    in App",
      };

      boundary.componentDidCatch(simulatedError, simulatedErrorInfo);

      expect(records.length).toBe(1);

      const fatalRecord = records[0];
      expect(fatalRecord.level).toBe(LogLevel.FATAL);
      expect(fatalRecord.category).toBe("component:error-boundary");
      expect(fatalRecord.message).toContain("Uncaught React component render crash");
      expect(fatalRecord.message).toContain("Maximum call stack size exceeded in InventoryGrid");
      expect(String(fatalRecord.context?.componentStack)).toContain("InventoryGrid");
      expect(fatalRecord.error?.name).toBe("RangeError");
    });
  });

  describe("Live RingBuffer & EventLog Integration", () => {
    it("buffers live events and provides formatted export for crash diagnostics", () => {
      const ringBuffer = new RingBufferTransport({ capacity: 50 });

      ringBuffer.write({
        id: "evt-1",
        timestamp: Date.now(),
        timeFormatted: "10:15:20.123",
        level: LogLevel.INFO,
        levelName: "INFO",
        category: "game:engine",
        message: "Loading location: courtyard",
      });

      ringBuffer.write({
        id: "evt-2",
        timestamp: Date.now(),
        timeFormatted: "10:15:21.456",
        level: LogLevel.ERROR,
        levelName: "ERROR",
        category: "component:inventory",
        message: "Failed to equip item: cursed_blade",
        error: {
          name: "ItemEquipError",
          message: "Stat requirement not met",
        },
      });

      const logs = ringBuffer.getLogs();
      expect(logs.length).toBe(2);

      const exportedText = ringBuffer.exportAsText();
      expect(exportedText).toContain("[10:15:20.123] [INFO] [game:engine] Loading location: courtyard");
      expect(exportedText).toContain("[10:15:21.456] [ERROR] [component:inventory] Failed to equip item: cursed_blade");
      expect(exportedText).toContain("Error: ItemEquipError: Stat requirement not met");
    });
  });

  describe("Composite Architecture & Fallback Customization", () => {
    it("exposes all compound subcomponents statically", () => {
      expect(GameErrorBoundary.Container).toBeDefined();
      expect(GameErrorBoundary.Icon).toBeDefined();
      expect(GameErrorBoundary.Title).toBeDefined();
      expect(GameErrorBoundary.Description).toBeDefined();
      expect(GameErrorBoundary.Details).toBeDefined();
      expect(GameErrorBoundary.Actions).toBeDefined();
      expect(GameErrorBoundary.RetryButton).toBeDefined();
      expect(GameErrorBoundary.CopyButton).toBeDefined();
      expect(GameErrorBoundary.ReloadButton).toBeDefined();
      expect(GameErrorBoundary.DefaultFallback).toBeDefined();
    });

    it("renders children when no error has occurred", () => {
      const boundary = new GameErrorBoundary({
        children: React.createElement("div", { id: "child-content" }, "Normal Game View"),
      });

      const rendered = boundary.render();
      expect(React.isValidElement(rendered)).toBe(true);
    });

    it("renders custom element fallback when error occurs", () => {
      const boundary = new GameErrorBoundary({
        children: null,
        fallback: React.createElement("div", { id: "custom-fallback" }, "Custom Inline Error"),
      });

      // Simulate error state
      boundary.state = {
        hasError: true,
        error: new Error("Subsystem crashed"),
        componentStack: null,
        copied: false,
      };

      const rendered = boundary.render() as React.ReactElement<any>;
      expect(rendered).not.toBeNull();
      // Rendered is wrapped in GameErrorContext.Provider
      expect(rendered.props.value.error?.message).toBe("Subsystem crashed");
      expect(rendered.props.children.props.id).toBe("custom-fallback");
    });

    it("renders function fallback providing GameErrorContextValue", () => {
      let capturedContext: any = null;
      const boundary = new GameErrorBoundary({
        children: null,
        fallback: (ctx: any) => {
          capturedContext = ctx;
          return React.createElement("button", { onClick: ctx.onRetry }, "Mini Retry");
        },
      });

      boundary.state = {
        hasError: true,
        error: new Error("Mini-map failure"),
        componentStack: "\n in MiniMap",
        copied: false,
      };

      boundary.render();
      expect(capturedContext).not.toBeNull();
      expect(capturedContext.error.message).toBe("Mini-map failure");
      expect(capturedContext.componentStack).toBe("\n in MiniMap");
      expect(typeof capturedContext.onRetry).toBe("function");
      expect(typeof capturedContext.onReload).toBe("function");
      expect(typeof capturedContext.onCopyReport).toBe("function");
    });

    it("throws clear error when compound subcomponent is used outside GameErrorContext", () => {
      expect(() => {
        const { renderToString } = require("react-dom/server");
        renderToString(React.createElement(GameErrorBoundary.Title));
      }).toThrow("GameErrorBoundary compound subcomponents must be rendered within a GameErrorBoundary error state.");
    });

    it("renders default fallback compound structure into HTML", () => {
      const { renderToString } = require("react-dom/server");
      const boundary = new GameErrorBoundary({
        children: null,
      });

      boundary.state = {
        hasError: true,
        error: new Error("Fatal texture crash"),
        componentStack: "\n in TextureLoader",
        copied: false,
      };

      const rendered = boundary.render() as React.ReactElement;
      const html = renderToString(rendered);

      expect(html).toContain('role="alert"');
      expect(html).toContain("An Unexpected Castle Anomaly Occurred");
      expect(html).toContain("Fatal texture crash");
      expect(html).toContain("Retry Interface");
      expect(html).toContain("Copy Diagnostic Log");
      expect(html).toContain("Reload Game");
    });
  });
});

