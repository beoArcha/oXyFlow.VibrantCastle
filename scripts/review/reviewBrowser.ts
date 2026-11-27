import { win32 } from "node:path";

/** Chromium build directory that the Windows fallback points at (Playwright build 1248). */
const WINDOWS_CHROMIUM_SUBPATH = ["ms-playwright", "chromium-1248", "chrome-win64", "chrome.exe"];

export interface ChromiumResolveInput {
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly platform: string;
  readonly homeDir: string;
}

/**
 * Picks the browser executable for the review run.
 * PLAYWRIGHT_CHROMIUM_PATH wins; on Windows the default cache path is used;
 * elsewhere `undefined` lets Playwright choose its own browser.
 */
export function resolveChromiumExecutable(input: ChromiumResolveInput): string | undefined {
  const fromEnv = input.env.PLAYWRIGHT_CHROMIUM_PATH?.trim();
  if (fromEnv) return fromEnv;
  if (input.platform !== "win32") return undefined;
  const localAppData = input.env.LOCALAPPDATA?.trim() || win32.join(input.homeDir, "AppData", "Local");
  return win32.join(localAppData, ...WINDOWS_CHROMIUM_SUBPATH);
}
