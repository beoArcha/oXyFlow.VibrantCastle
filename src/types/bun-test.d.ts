/**
 * Ambient type definitions for Bun's native test runner (bun:test).
 * Provides strongly-typed matchers (including Jest/Bun extended matchers),
 * test lifecycle hooks, and mock utilities.
 */

declare module "bun:test" {
  export interface BunMatcher<T = any> {
    toBe(expected: any, message?: string): void;
    toEqual(expected: any, message?: string): void;
    toStrictEqual(expected: any, message?: string): void;
    toBeDefined(message?: string): void;
    toBeUndefined(message?: string): void;
    toBeNull(message?: string): void;
    toBeTruthy(message?: string): void;
    toBeFalsy(message?: string): void;
    toBeNaN(message?: string): void;
    toBeArray(message?: string): void;
    toBeBoolean(message?: string): void;
    toBeNumber(message?: string): void;
    toBeString(message?: string): void;
    toBeFunction(message?: string): void;
    toBeEmpty(message?: string): void;
    toBeNil(message?: string): void;
    toBeGreaterThan(expected: number | bigint, message?: string): void;
    toBeGreaterThanOrEqual(expected: number | bigint, message?: string): void;
    toBeLessThan(expected: number | bigint, message?: string): void;
    toBeLessThanOrEqual(expected: number | bigint, message?: string): void;
    toBeCloseTo(expected: number, precision?: number, message?: string): void;
    toBeInstanceOf(expected: any, message?: string): void;
    toContain(expected: any, message?: string): void;
    toContainEqual(expected: any, message?: string): void;
    toHaveLength(expected: number, message?: string): void;
    toHaveProperty(keyPath: string | readonly string[], value?: any, message?: string): void;
    toMatch(expected: string | RegExp, message?: string): void;
    toMatchObject(expected: Record<string, any> | Array<any>, message?: string): void;
    toThrow(expected?: string | RegExp | Error | (new (...args: any[]) => any)): void;
    toThrowError(expected?: string | RegExp | Error | (new (...args: any[]) => any)): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledTimes(expected: number): void;
    toHaveBeenCalledWith(...expected: any[]): void;
    toHaveBeenLastCalledWith(...expected: any[]): void;
    toHaveBeenNthCalledWith(n: number, ...expected: any[]): void;
    toHaveReturned(): void;
    toHaveReturnedTimes(expected: number): void;
    toHaveReturnedWith(expected: any): void;
    toHaveLastReturnedWith(expected: any): void;
    toHaveNthReturnedWith(n: number, expected: any): void;
    not: BunMatcher<T>;
    resolves: BunMatcher<T>;
    rejects: BunMatcher<T>;
  }

  export type Mock<T extends (...args: any[]) => any = (...args: any[]) => any> = T & {
    mock: {
      calls: Parameters<T>[];
      results: { type: "return" | "throw"; value: any }[];
      instances: any[];
    };
    mockClear(): void;
    mockReset(): void;
    mockRestore(): void;
    mockImplementation(fn: (...args: Parameters<T>) => ReturnType<T>): Mock<T>;
    mockImplementationOnce(fn: (...args: Parameters<T>) => ReturnType<T>): Mock<T>;
    mockReturnValue(val: ReturnType<T>): Mock<T>;
    mockReturnValueOnce(val: ReturnType<T>): Mock<T>;
    mockResolvedValue(val: Awaited<ReturnType<T>>): Mock<T>;
    mockResolvedValueOnce(val: Awaited<ReturnType<T>>): Mock<T>;
    mockRejectedValue(val: any): Mock<T>;
    mockRejectedValueOnce(val: any): Mock<T>;
  };

  export function describe(name: string, fn: () => void): void;
  export namespace describe {
    export function only(name: string, fn: () => void): void;
    export function skip(name: string, fn: () => void): void;
    export function todo(name: string): void;
    export function each(table: readonly any[]): (name: string, fn: (...args: any[]) => void | Promise<void>) => void;
  }

  export function it(name: string, fn: () => void | Promise<void>): void;
  export namespace it {
    export function only(name: string, fn: () => void | Promise<void>): void;
    export function skip(name: string, fn: () => void | Promise<void>): void;
    export function todo(name: string): void;
    export function each(table: readonly any[]): (name: string, fn: (...args: any[]) => void | Promise<void>) => void;
  }

  export const test: typeof it;

  export function expect<T = any>(actual: T): BunMatcher<T>;

  export function beforeAll(fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;

  export function spyOn<T extends object, K extends keyof T>(
    obj: T,
    method: K
  ): T[K] extends (...args: any[]) => any ? Mock<T[K]> : Mock<(...args: any[]) => any>;

  export function mock<T extends (...args: any[]) => any>(fn?: T): Mock<T>;
  export namespace mock {
    export function module(specifier: string, factory: () => any): void;
    export function restore(): void;
  }
}

// Ambient global test flag for React 19 act() environment
// eslint-disable-next-line no-var
declare var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
