import { describe, expect, it } from "bun:test";
import {
  andThen,
  err,
  ErrorCode,
  fromThrowable,
  GameplayError,
  isErr,
  isOk,
  map,
  mapErr,
  match,
  ok,
  ParserError,
  Result,
  tryCatch,
  unwrap,
  unwrapOr,
  wrapThrowable,
} from "../index";

describe("SOLID Result<T, E> Pattern", () => {
  describe("Basic Construction & Type Narrowing", () => {
    it("creates Ok result with boolean discriminator ok = true", () => {
      const res = ok(42);

      expect(res.ok).toBe(true);
      expect(isOk(res)).toBe(true);
      expect(isErr(res)).toBe(false);
      expect(res.isOk()).toBe(true);
      expect(res.isErr()).toBe(false);
      if (res.ok) {
        expect(res.value).toBe(42);
      }
    });

    it("creates Err result with boolean discriminator ok = false", () => {
      const error = new GameplayError("Slot locked", ErrorCode.GAMEPLAY_SLOT_LOCKED);
      const res = err(error);

      expect(res.ok).toBe(false);
      expect(isOk(res)).toBe(false);
      expect(isErr(res)).toBe(true);
      expect(res.isOk()).toBe(false);
      expect(res.isErr()).toBe(true);
      if (!res.ok) {
        expect(res.error).toBe(error);
        expect(res.error.code).toBe(ErrorCode.GAMEPLAY_SLOT_LOCKED);
      }
    });
  });

  describe("Unwrapping & Fallbacks", () => {
    it("unwraps Ok value or returns fallback on Err", () => {
      const success: Result<number, string> = ok(100);
      const failure: Result<number, string> = err("failed");

      expect(unwrapOr(success, 0)).toBe(100);
      expect(unwrapOr(failure, 0)).toBe(0);
      expect(success.unwrapOr(0)).toBe(100);
      expect(failure.unwrapOr(0)).toBe(0);
    });

    it("unwraps Ok value directly, or throws contained error on Err", () => {
      const success = ok("ready");
      expect(unwrap(success)).toBe("ready");
      expect(success.unwrap()).toBe("ready");

      const failure = err(new GameplayError("Out of mana", ErrorCode.GAMEPLAY_INSUFFICIENT_MANA));
      expect(() => unwrap(failure)).toThrow(GameplayError);
      expect(() => failure.unwrap()).toThrow(GameplayError);
    });
  });

  describe("Combinators, Method Chaining & Zero Allocations", () => {
    it("maps Ok value and preserves Err instance without reallocating", () => {
      const success = ok(10);
      const mappedSuccess = success.map((x) => x * 2);
      expect(mappedSuccess.unwrapOr(0)).toBe(20);

      const failure: Result<number, string> = err("error");
      const mappedFailure = failure.map((x) => x * 2);
      expect(isErr(mappedFailure)).toBe(true);
      // Zero-allocation: Err.map returns the exact same instance!
      expect(mappedFailure).toBe(failure);
    });

    it("maps Err error and preserves Ok instance without reallocating", () => {
      const failure: Result<number, string> = err("not found");
      const mappedErr = failure.mapErr((msg) => new GameplayError(msg, ErrorCode.GAMEPLAY_ITEM_NOT_FOUND));

      expect(isErr(mappedErr)).toBe(true);
      if (!mappedErr.ok) {
        expect(mappedErr.error.code).toBe(ErrorCode.GAMEPLAY_ITEM_NOT_FOUND);
      }

      const success: Result<number, string> = ok(50);
      const mappedSuccess = success.mapErr(() => new GameplayError("fail", ErrorCode.GAMEPLAY_INVALID_ACTION));
      expect(mappedSuccess.unwrapOr(0)).toBe(50);
      // Zero-allocation: Ok.mapErr returns the exact same instance!
      expect(mappedSuccess).toBe(success);
    });

    it("chains dependent operations with andThen supporting different error types", () => {
      const parseNumber = (str: string): Result<number, string> => {
        const val = Number(str);
        return isNaN(val) ? err("Not a number") : ok(val);
      };

      const ensurePositive = (num: number): Result<number, number> => {
        return num > 0 ? ok(num) : err(-1);
      };

      // andThen supports returning different error type: string | number
      const chainedSuccess = parseNumber("42").andThen(ensurePositive);
      expect(chainedSuccess.unwrapOr(0)).toBe(42);

      const invalidNan = parseNumber("abc").andThen(ensurePositive);
      expect(isErr(invalidNan)).toBe(true);
      if (!invalidNan.ok) {
        expect(invalidNan.error).toBe("Not a number");
      }

      const negative = parseNumber("-5").andThen(ensurePositive);
      expect(isErr(negative)).toBe(true);
      if (!negative.ok) {
        expect(negative.error).toBe(-1);
      }
    });

    it("supports pattern matching with match()", () => {
      const success = ok(100);
      const okMsg = match(success, {
        ok: (v) => `Value: ${v}`,
        err: (e) => `Error: ${e}`,
      });
      expect(okMsg).toBe("Value: 100");

      const failure = err("Network down");
      const errMsg = failure.match({
        ok: (v) => `Value: ${v}`,
        err: (e) => `Error: ${e}`,
      });
      expect(errMsg).toBe("Error: Network down");
    });
  });

  describe("Exception Safety (tryCatch & wrapThrowable)", () => {
    it("safely converts throwable operation to Result with tryCatch / fromThrowable", () => {
      const okRes = tryCatch(
        () => JSON.parse('{"mana":100}'),
        (thrown) => new ParserError("Failed", ErrorCode.PARSER_INVALID_FORMAT, { cause: thrown })
      );
      expect(isOk(okRes)).toBe(true);
      expect(okRes.unwrapOr({}).mana).toBe(100);

      const errRes = fromThrowable(
        () => JSON.parse("invalid{json"),
        (thrown) => new ParserError("Failed", ErrorCode.PARSER_INVALID_FORMAT, { cause: thrown })
      );
      expect(isErr(errRes)).toBe(true);
      if (!errRes.ok) {
        expect(errRes.error.code).toBe(ErrorCode.PARSER_INVALID_FORMAT);
      }
    });

    it("wraps throwable functions with wrapThrowable", () => {
      const safeParseInt = wrapThrowable(
        (str: string, radix: number) => {
          if (str.startsWith("bad")) throw new Error("Malformed string");
          return parseInt(str, radix);
        },
        (thrown) => new ParserError("Parse failed", ErrorCode.PARSER_INVALID_FORMAT, { cause: thrown })
      );

      const success = safeParseInt("42", 10);
      expect(success.isOk()).toBe(true);
      expect(success.unwrapOr(0)).toBe(42);

      const failure = safeParseInt("bad_input", 10);
      expect(failure.isErr()).toBe(true);
      if (!failure.ok) {
        expect(failure.error.code).toBe(ErrorCode.PARSER_INVALID_FORMAT);
      }
    });
  });
});
