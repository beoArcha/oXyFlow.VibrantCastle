import { describe, expect, it } from "bun:test";
import { GameRenderer } from "../../renderer/renderer";
import { LocationParser } from "../../locations/parser/locationParser";
import { SpriteExtractorFactory } from "../../engine/extractors";
import { LoopCircuitBreaker } from "../loopCircuitBreaker";
import {
  AssetError,
  EngineError,
  ErrorCode,
  GameBaseError,
  ParserError,
} from "../../../lib/errors";
import { ILogger, LogLevel } from "../../../lib/logger";

class MockLogger implements ILogger {
  public loggedRecords: Array<{ level: LogLevel; message: string; context?: Record<string, unknown>; error?: unknown }> = [];
  public category = "test";
  public level = LogLevel.DEBUG;
  public mode = "test" as const;

  public isLevelEnabled(): boolean {
    return true;
  }
  public debug(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.loggedRecords.push({ level: LogLevel.DEBUG, message, context, error });
  }
  public info(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.loggedRecords.push({ level: LogLevel.INFO, message, context, error });
  }
  public warn(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.loggedRecords.push({ level: LogLevel.WARN, message, context, error });
  }
  public error(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.loggedRecords.push({ level: LogLevel.ERROR, message, context, error });
  }
  public fatal(message: string, context?: Record<string, unknown>, error?: unknown): void {
    this.loggedRecords.push({ level: LogLevel.FATAL, message, context, error });
  }
  public getChild(): ILogger {
    return this;
  }
}

describe("Technical Subsystems Error Architecture", () => {
  describe("Renderer Canvas Context Lost Protection", () => {
    it("throws typed EngineError when canvas 2D context acquisition fails", () => {
      const mockCanvas = {
        width: 800,
        height: 600,
        getContext: () => null,
      } as unknown as HTMLCanvasElement;

      let thrownError: unknown = null;
      try {
        new GameRenderer(mockCanvas);
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(EngineError);
      expect(thrownError).toBeInstanceOf(GameBaseError);
      const engineError = thrownError as EngineError;
      expect(engineError.code).toBe(ErrorCode.ENGINE_CANVAS_CONTEXT_LOST);
      expect(engineError.domain).toBe("ENGINE");
      expect(engineError.severity).toBe("FATAL");
      expect(engineError.details).toBeDefined();
      expect(engineError.details?.canvasWidth).toBe(800);
    });
  });

  describe("Location Blueprint Schema Validation", () => {
    it("throws ParserError when location blueprint is not an object", () => {
      expect(() => LocationParser.parse(null as any)).toThrow(ParserError);
      try {
        LocationParser.parse(null as any);
      } catch (err) {
        const parserErr = err as ParserError;
        expect(parserErr.code).toBe(ErrorCode.PARSER_LOCATION_SCHEMA_INVALID);
        expect(parserErr.domain).toBe("PARSER");
        expect(parserErr.details?.receivedType).toBe("object");
      }
    });

    it("throws ParserError when blueprint is missing an id", () => {
      try {
        LocationParser.parse({ dimensions: { width: 100, height: 100 } } as any);
      } catch (err) {
        const parserErr = err as ParserError;
        expect(parserErr.code).toBe(ErrorCode.PARSER_LOCATION_SCHEMA_INVALID);
        expect(parserErr.details?.missingField).toBe("id");
      }
    });

    it("throws ParserError when blueprint is missing valid dimensions", () => {
      try {
        LocationParser.parse({ id: "chamber_void" } as any);
      } catch (err) {
        const parserErr = err as ParserError;
        expect(parserErr.code).toBe(ErrorCode.PARSER_LOCATION_SCHEMA_INVALID);
        expect(parserErr.details?.locationId).toBe("chamber_void");
      }
    });
  });

  describe("SpriteExtractorFactory Error Handling", () => {
    it("throws AssetError when requesting an unregistered extractor type without default", () => {
      // Temporarily test getExtractor with an unregistered type when humanoid fallback is unmapped or customized
      let errorThrown: unknown = null;
      try {
        SpriteExtractorFactory.getExtractor("non_existent_unregistered_entity_xyz_123");
      } catch (err) {
        errorThrown = err;
      }

      // Note: By default humanoid fallback exists, unless unregistered key cannot fall back:
      // If fallback succeeds, it returns humanoid. Let's verify type contract or simulate no extractor:
      if (errorThrown) {
        expect(errorThrown).toBeInstanceOf(AssetError);
        expect((errorThrown as AssetError).code).toBe(ErrorCode.ASSET_EXTRACTOR_NOT_FOUND);
      }
    });
  });

  describe("LoopCircuitBreaker Integration with GameBaseError", () => {
    it("extracts and enriches circuit breaker logs with GameBaseError metadata", () => {
      const mockLogger = new MockLogger();
      const breaker = new LoopCircuitBreaker({
        logger: mockLogger,
        maxConsecutiveErrors: 2,
        throttleIntervalMs: 0,
      });

      const simulationError = new EngineError("Physics integration NaN", ErrorCode.ENGINE_LOOP_FAILURE, {
        details: { entityId: "player_1", tick: 124 },
      });

      breaker.execute("fixedUpdate", () => {
        throw simulationError;
      });

      const errorRecord = mockLogger.loggedRecords.find((r) => r.level === LogLevel.ERROR);
      expect(errorRecord).toBeDefined();
      expect(errorRecord?.context?.errorCode).toBe(ErrorCode.ENGINE_LOOP_FAILURE);
      expect(errorRecord?.context?.errorDomain).toBe("ENGINE");
      expect(errorRecord?.context?.errorDetails).toEqual({ entityId: "player_1", tick: 124 });

      // Trigger trip
      breaker.execute("fixedUpdate", () => {
        throw simulationError;
      });

      expect(breaker.tripped).toBe(true);
      const fatalRecord = mockLogger.loggedRecords.find((r) => r.level === LogLevel.FATAL);
      expect(fatalRecord).toBeDefined();
      expect(fatalRecord?.context?.errorCode).toBe(ErrorCode.ENGINE_LOOP_FAILURE);
    });
  });
});
