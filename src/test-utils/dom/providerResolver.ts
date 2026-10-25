import type React from "react";
import { TestProviders, UiTestProviders, IntegrationTestProviders } from "../testProviders";
import type { TestProviderMode } from "./domTypes";

export type ProviderComponent = React.ComponentType<{ children: React.ReactNode }>;

/**
 * Resolves the appropriate React provider wrapper for unit and integration test harnesses.
 */
export function resolveTestProvider(
  mode?: TestProviderMode,
  customWrapper?: ProviderComponent | null
): ProviderComponent | null {
  if (customWrapper !== undefined) {
    return customWrapper;
  }
  if (mode === "ui") {
    return UiTestProviders;
  }
  if (mode === "integration") {
    return IntegrationTestProviders;
  }
  if (mode === "none") {
    return null;
  }
  return TestProviders;
}
