import { describe, expect, it } from "bun:test";
import {
  AssetError,
  CanvasContextError,
  EngineError,
  ErrorCode,
  GameBaseError,
  GameErrorContextViolationError,
  GameplayError,
  MissingContextProviderError,
  ModalContextViolationError,
  ParserError,
  SaveError,
  SystemError,
  TabsContextViolationError,
  UIError,
  UnwrapFailedError,
} from "../index";

describe("SOLID Error Hierarchy", () => {
  describe("Liskov Substitution Principle & Inheritance", () => {
    it("subclasses must be instances of GameBaseError and native Error", () => {
      const err = new EngineError("Canvas context failed", ErrorCode.ENGINE_CANVAS_CONTEXT_LOST);

      expect(err instanceof Error).toBe(true);
      expect(err instanceof GameBaseError).toBe(true);
      expect(err instanceof EngineError).toBe(true);
      expect(err.name).toBe("EngineError");
      expect(err.code).toBe(ErrorCode.ENGINE_CANVAS_CONTEXT_LOST);
      expect(err.domain).toBe("ENGINE");
      expect(err.severity).toBe("ERROR");
    });

    it("verifies accurate names and domains for all domain error subclasses", () => {
      const assetErr = new AssetError("Sprite sheet missing", ErrorCode.ASSET_NOT_FOUND);
      expect(assetErr.domain).toBe("ASSET");
      expect(assetErr.name).toBe("AssetError");

      const parserErr = new ParserError("Malformed level json", ErrorCode.PARSER_LOCATION_SCHEMA_INVALID);
      expect(parserErr.domain).toBe("PARSER");
      expect(parserErr.name).toBe("ParserError");

      const saveErr = new SaveError("Storage quota exceeded", ErrorCode.SAVE_STORAGE_QUOTA_EXCEEDED);
      expect(saveErr.domain).toBe("SAVE");
      expect(saveErr.name).toBe("SaveError");

      const uiErr = new UIError("Render failed", ErrorCode.UI_RENDER_FAILURE);
      expect(uiErr.domain).toBe("REACT");
      expect(uiErr.name).toBe("UIError");

      const gameplayErr = new GameplayError("Not enough mana", ErrorCode.GAMEPLAY_INSUFFICIENT_MANA);
      expect(gameplayErr.domain).toBe("GAMEPLAY");
      expect(gameplayErr.severity).toBe("WARN");
      expect(gameplayErr.name).toBe("GameplayError");

      const systemErr = new SystemError("Host process failed", ErrorCode.UNKNOWN_ERROR);
      expect(systemErr.domain).toBe("SYSTEM");
      expect(systemErr.severity).toBe("ERROR");
      expect(systemErr.name).toBe("SystemError");
    });

    it("verifies specialized leaf classes specialize base domain errors", () => {
      const canvasErr = new CanvasContextError("Context missing");
      expect(canvasErr instanceof CanvasContextError).toBe(true);
      expect(canvasErr instanceof EngineError).toBe(true);
      expect(canvasErr instanceof GameBaseError).toBe(true);
      expect(canvasErr.code).toBe(ErrorCode.ENGINE_CANVAS_2D_UNAVAILABLE);
      expect(canvasErr.domain).toBe("ENGINE");

      const tabsErr = new TabsContextViolationError("List");
      expect(tabsErr instanceof TabsContextViolationError).toBe(true);
      expect(tabsErr instanceof UIError).toBe(true);
      expect(tabsErr.code).toBe(ErrorCode.UI_TABS_CONTEXT_VIOLATION);
      expect(tabsErr.severity).toBe("FATAL");
      expect(tabsErr.componentName).toBe("List");
      expect(tabsErr.message).toContain("<Tabs.List>");

      const modalErr = new ModalContextViolationError("Header");
      expect(modalErr instanceof ModalContextViolationError).toBe(true);
      expect(modalErr instanceof UIError).toBe(true);
      expect(modalErr.code).toBe(ErrorCode.UI_MODAL_CONTEXT_VIOLATION);
      expect(modalErr.severity).toBe("FATAL");
      expect(modalErr.componentName).toBe("Header");
      expect(modalErr.message).toContain("<Modal.Header>");

      const gameErrorContextErr = new GameErrorContextViolationError();
      expect(gameErrorContextErr instanceof GameErrorContextViolationError).toBe(true);
      expect(gameErrorContextErr instanceof UIError).toBe(true);
      expect(gameErrorContextErr.code).toBe(ErrorCode.REACT_MISSING_CONTEXT);
      expect(gameErrorContextErr.severity).toBe("FATAL");
      expect(gameErrorContextErr.message).toContain("GameErrorBoundary compound subcomponents");

      const unwrapErr = new UnwrapFailedError("Bad state payload");
      expect(unwrapErr instanceof UnwrapFailedError).toBe(true);
      expect(unwrapErr instanceof SystemError).toBe(true);
      expect(unwrapErr.code).toBe(ErrorCode.SYSTEM_UNWRAP_FAILED);
      expect(unwrapErr.severity).toBe("FATAL");
      expect(unwrapErr.unwrapCause).toBe("Bad state payload");
    });

    it("verifies MissingContextProviderError specializes UIError with hook and provider details", () => {
      const missingContext = new MissingContextProviderError("useSettings", "SettingsProvider");

      expect(missingContext instanceof UIError).toBe(true);
      expect(missingContext instanceof GameBaseError).toBe(true);
      expect(missingContext.code).toBe(ErrorCode.REACT_MISSING_CONTEXT);
      expect(missingContext.severity).toBe("FATAL");
      expect(missingContext.hookName).toBe("useSettings");
      expect(missingContext.providerName).toBe("SettingsProvider");
      expect(missingContext.message).toContain("useSettings");
      expect(missingContext.message).toContain("SettingsProvider");
    });
  });

  describe("Context Extraction & Cause Chaining (toLogContext)", () => {
    it("generates structured log context with frozen details and timestamp", () => {
      const err = new ParserError("Missing required property 'width'", ErrorCode.PARSER_LOCATION_SCHEMA_INVALID, {
        details: { property: "width", locationId: "chamber_01" },
      });

      const context = err.toLogContext();

      expect(context.code).toBe(ErrorCode.PARSER_LOCATION_SCHEMA_INVALID);
      expect(context.domain).toBe("PARSER");
      expect(context.severity).toBe("ERROR");
      expect(context.details).toEqual({ property: "width", locationId: "chamber_01" });
      expect(typeof context.timestamp).toBe("number");
      expect(Object.isFrozen(err.details)).toBe(true);
    });

    it("safely serializes native Error cause chains recursively", () => {
      const nativeCause = new TypeError("Canvas rendering context was null");
      const engineErr = new EngineError("Failed to init canvas", ErrorCode.ENGINE_CANVAS_CONTEXT_LOST, {
        cause: nativeCause,
      });

      const context = engineErr.toLogContext();
      expect(context.cause).toBeDefined();
      const cause = context.cause as { name: string; message: string };
      expect(cause.name).toBe("TypeError");
      expect(cause.message).toBe("Canvas rendering context was null");
    });

    it("safely serializes GameBaseError cause chains", () => {
      const parserCause = new ParserError("JSON syntax error", ErrorCode.PARSER_INVALID_FORMAT);
      const loadErr = new AssetError("Failed to load level manifest", ErrorCode.ASSET_LOAD_FAILED, {
        cause: parserCause,
      });

      const context = loadErr.toLogContext();
      expect(context.cause).toBeDefined();
      const cause = context.cause as { code: string; domain: string };
      expect(cause.code).toBe(ErrorCode.PARSER_INVALID_FORMAT);
      expect(cause.domain).toBe("PARSER");
    });

    it("formats toString cleanly with domain, code, and message", () => {
      const err = new SaveError("Slot 1 is empty", ErrorCode.SAVE_SLOT_EMPTY);
      expect(err.toString()).toBe("[SAVE:SAVE_SLOT_EMPTY] Slot 1 is empty");
    });
  });
});
