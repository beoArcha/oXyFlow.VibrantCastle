/**
 * Global test environment initialization for Bun test runner.
 * Automatically preloaded via bunfig.toml before tests execute.
 */

// Ensure NODE_ENV is set to "test"
process.env.NODE_ENV = "test";

// Mark React act environment for testing
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach } from "bun:test";
import { LoggerManager } from "./lib/logger";
import { cleanupDom } from "./test-utils/domTestUtils";

afterEach(async () => {
  const manager = LoggerManager.getInstance();
  if (manager.mode !== "test") {
    LoggerManager.resetInstance({ mode: "test" });
  }
  await cleanupDom();
});
