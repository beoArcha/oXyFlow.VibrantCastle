/**
 * Domain Errors Aggregator & Barrel
 * 
 * Re-exports categorized domain error classes for full backward compatibility.
 * Consumers may import directly from this barrel or via the root @lib/errors facade.
 */

export * from "./types";
export * from "./engineErrors";
export * from "./assetErrors";
export * from "./parserErrors";
export * from "./saveErrors";
export * from "./uiErrors";
export * from "./domainError";
export * from "./systemErrors";
export * from "./architectureErrors";
