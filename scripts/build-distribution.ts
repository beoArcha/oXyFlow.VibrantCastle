#!/usr/bin/env bun
/**
 * Vibrant Castle — GitHub Pages Distribution Assembler
 * Builds the production game client with relative base "./" into dist/game/
 * and layers the lifted bilingual Gothic Wiki portal + .nojekyll marker at dist/.
 */

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { WIKI_ARTICLES, WIKI_DICTIONARIES } from "./wiki/wikiContent";
import { WIKI_STYLES_CSS } from "./wiki/wikiStyles";
import { WIKI_APP_SCRIPT_JS } from "./wiki/wikiAppScript";
import { renderWikiIndexHtml } from "./wiki/wikiTemplate";
import { resolveBuildVersion } from "./lib/buildVersion";

const ROOT_DIR = resolve(import.meta.dirname, "..");
const DIST_DIR = join(ROOT_DIR, "dist");
const GAME_TMP_DIR = join(ROOT_DIR, ".dist-game-tmp");

export function assembleWikiShell(targetDir: string, version?: string): void {
  mkdirSync(join(targetDir, "styles"), { recursive: true });
  mkdirSync(join(targetDir, "scripts"), { recursive: true });
  mkdirSync(join(targetDir, "i18n"), { recursive: true });
  mkdirSync(join(targetDir, "pl"), { recursive: true });
  mkdirSync(join(targetDir, "en"), { recursive: true });

  // Prevent GitHub Pages Jekyll processing of underscore-prefixed assets
  writeFileSync(join(targetDir, ".nojekyll"), "", "utf8");

  // Wiki shell entry + styles + interactive runtime
  writeFileSync(join(targetDir, "index.html"), renderWikiIndexHtml(version), "utf8");
  writeFileSync(join(targetDir, "styles", "wiki.css"), WIKI_STYLES_CSS, "utf8");
  writeFileSync(join(targetDir, "scripts", "wiki-app.js"), WIKI_APP_SCRIPT_JS, "utf8");

  // Bilingual dictionaries
  for (const lang of ["pl", "en"] as const) {
    writeFileSync(
      join(targetDir, "i18n", `${lang}.json`),
      JSON.stringify(WIKI_DICTIONARIES[lang], null, 2) + "\n",
      "utf8"
    );

    for (const [filename, markdown] of Object.entries(WIKI_ARTICLES[lang])) {
      writeFileSync(join(targetDir, lang, filename), markdown, "utf8");
    }
  }
}

export function buildDistribution(): void {
  console.log("[build:pages] Cleaning previous build output...");
  rmSync(DIST_DIR, { recursive: true, force: true });
  rmSync(GAME_TMP_DIR, { recursive: true, force: true });

  const { version } = resolveBuildVersion(ROOT_DIR);
  console.log(`[build:pages] Build version ${version}`);

  console.log("[build:pages] Compiling Vite game client with relative base './'...");
  const buildResult = spawnSync(
    "bunx",
    ["vite", "build", "--base", "./", "--outDir", GAME_TMP_DIR],
    {
      cwd: ROOT_DIR,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "production",
        VITE_BASE_PATH: "./",
        VC_APP_VERSION: version,
      },
    }
  );

  if (buildResult.status !== 0) {
    rmSync(GAME_TMP_DIR, { recursive: true, force: true });
    console.error("[build:pages] Vite game build failed.");
    process.exit(buildResult.status ?? 1);
  }

  console.log("[build:pages] Assembling dist/ Wiki portal and dist/game/ client...");
  mkdirSync(DIST_DIR, { recursive: true });
  assembleWikiShell(DIST_DIR, version);
  writeFileSync(
    join(DIST_DIR, "version.json"),
    JSON.stringify({ version, builtAt: new Date().toISOString() }, null, 2) + "\n",
    "utf8"
  );

  const gameTargetDir = join(DIST_DIR, "game");
  cpSync(GAME_TMP_DIR, gameTargetDir, { recursive: true });
  rmSync(GAME_TMP_DIR, { recursive: true, force: true });

  if (!existsSync(join(gameTargetDir, "index.html"))) {
    console.error("[build:pages] Expected dist/game/index.html was not produced.");
    process.exit(1);
  }

  console.log("[build:pages] Distribution ready at dist/ (Wiki portal + /game/ client).");
}

if (import.meta.main) {
  buildDistribution();
}
