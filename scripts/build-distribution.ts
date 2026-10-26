/**
 * Vibrant Castle — Distribution Assembly Script for GitHub Pages
 * Merges docs/wiki/ at root (dist/) and mounts the compiled game client in dist/game/.
 * Formats output for terminal logs and emits GitHub Actions workflow annotations.
 */

import { existsSync, mkdirSync, cpSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = resolve(import.meta.dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');
const GAME_DIST_DIR = join(DIST_DIR, 'game');
const WIKI_DIR = join(ROOT_DIR, 'docs', 'wiki');

function logInfo(message: string): void {
  console.log(`[distribute] ${message}`);
}

function logError(title: string, message: string): void {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.error(`::error title=${title}::${message}`);
  }
  console.error(`[distribute:ERROR] [${title}] ${message}`);
}

function logNotice(title: string, message: string): void {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.log(`::notice title=${title}::${message}`);
  }
  console.log(`[distribute:NOTICE] [${title}] ${message}`);
}

function logWarning(title: string, message: string): void {
  if (process.env.GITHUB_ACTIONS === 'true') {
    console.warn(`::warning title=${title}::${message}`);
  }
  console.warn(`[distribute:WARN] [${title}] ${message}`);
}

export function assembleDistribution(options: { existingGameDist?: string } = {}): void {
  logInfo('Starting distribution packaging for GitHub Pages...');

  // Step 1: Clean and prepare dist directory
  if (existsSync(DIST_DIR)) {
    logInfo('Cleaning existing dist/ directory...');
    rmSync(DIST_DIR, { recursive: true, force: true });
  }
  mkdirSync(DIST_DIR, { recursive: true });
  mkdirSync(GAME_DIST_DIR, { recursive: true });

  // Step 2: Populate dist/game/ with game client
  if (options.existingGameDist && existsSync(options.existingGameDist)) {
    logInfo(`Mounting existing game build from '${options.existingGameDist}' into dist/game/...`);
    cpSync(options.existingGameDist, GAME_DIST_DIR, { recursive: true });
  } else {
    logInfo('Compiling game client from src/ with Vite to dist/game/...');
    const viteBin = process.platform === 'win32' ? 'bun.exe' : 'bun';
    const viteBuild = spawnSync(
      viteBin,
      ['run', 'vite', 'build', '--outDir', 'dist/game', '--emptyOutDir'],
      {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production',
          VITE_BASE_PATH: '/vibrant_castle/game/',
        },
      }
    );

    if (viteBuild.status !== 0) {
      logError('Vite Compilation Failed', `Vite process exited with non-zero code ${viteBuild.status}`);
      process.exit(viteBuild.status ?? 1);
    }
  }

  // Step 3: Copy wiki documentation portal into dist/ root
  if (existsSync(WIKI_DIR)) {
    logInfo('Copying docs/wiki/ portal assets into dist/ root...');
    cpSync(WIKI_DIR, DIST_DIR, { recursive: true });
  } else {
    logWarning('Wiki Directory Missing', `Source documentation directory was not found at ${WIKI_DIR}`);
  }

  // Step 4: Write .nojekyll file for GitHub Pages
  const noJekyllPath = join(DIST_DIR, '.nojekyll');
  writeFileSync(noJekyllPath, '', 'utf8');

  // Verify critical assets
  const hasRootIndex = existsSync(join(DIST_DIR, 'index.html'));
  const hasGameIndex = existsSync(join(GAME_DIST_DIR, 'index.html'));

  if (!hasRootIndex || !hasGameIndex) {
    logError(
      'Distribution Verification Failed',
      `Missing required artifacts (hasRootIndex: ${hasRootIndex}, hasGameIndex: ${hasGameIndex})`
    );
    process.exit(1);
  }

  logNotice('Assembly Succeeded', 'GitHub Pages distribution package assembled successfully.');
  logInfo('Artifact structure:');
  logInfo('  - Wiki Portal: dist/index.html');
  logInfo('  - Game Client: dist/game/index.html');
  logInfo('  - Pages Marker: dist/.nojekyll');
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--game-dist');
  const existingGameDist = idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;

  assembleDistribution({ existingGameDist });
}
