/**
 * Vibrant Castle — Distribution Packaging Script
 * Bundles the game client into dist/game/ and merges docs/wiki/ at root for GitHub Pages.
 */

import { existsSync, mkdirSync, cpSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT_DIR = resolve(import.meta.dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');
const GAME_DIST_DIR = join(DIST_DIR, 'game');
const WIKI_DIR = join(ROOT_DIR, 'docs', 'wiki');

console.log('[distribute] Packaging Vibrant Castle for GitHub Pages...');

// Step 1: Clean dist directory
if (existsSync(DIST_DIR)) {
  rmSync(DIST_DIR, { recursive: true, force: true });
}
mkdirSync(DIST_DIR, { recursive: true });

// Step 2: Build game client with base path /vibrant_castle/game/
console.log('[distribute] Compiling game client with Vite to dist/game/...');
const viteBuild = spawnSync(
  process.platform === 'win32' ? 'bun.exe' : 'bun',
  ['run', 'vite', 'build', '--outDir', 'dist/game', '--emptyOutDir'],
  {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      VITE_BASE_PATH: '/vibrant_castle/game/'
    }
  }
);

if (viteBuild.status !== 0) {
  console.error('[distribute] Vite compilation failed with exit code:', viteBuild.status);
  process.exit(viteBuild.status ?? 1);
}

// Step 3: Copy wiki documentation & portal assets into dist/
if (existsSync(WIKI_DIR)) {
  console.log('[distribute] Merging docs/wiki/ into dist/ root...');
  cpSync(WIKI_DIR, DIST_DIR, { recursive: true });
} else {
  console.warn('[distribute] Warning: docs/wiki directory not found at', WIKI_DIR);
}

// Step 4: Write .nojekyll file for GitHub Pages
const noJekyllPath = join(DIST_DIR, '.nojekyll');
writeFileSync(noJekyllPath, '', 'utf8');

console.log('[distribute] Distribution package assembled successfully:');
console.log('  - Wiki Portal: dist/index.html');
console.log('  - Game Client: dist/game/index.html');
console.log('  - GitHub Pages Marker: dist/.nojekyll');
