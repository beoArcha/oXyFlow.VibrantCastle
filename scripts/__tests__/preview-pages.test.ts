import { describe, expect, it } from 'bun:test';
import path from 'node:path';
import { PAGES_BASE_PATH, resolvePagesRequest, type FsProbe } from '../preview-pages';

function createMockFs(files: string[], dirs: string[]): FsProbe {
    const fileSet = new Set(files.map((f) => path.resolve(f)));
    const dirSet = new Set(dirs.map((d) => path.resolve(d)));

    return {
        exists: (p) => fileSet.has(path.resolve(p)) || dirSet.has(path.resolve(p)),
        isDirectory: (p) => dirSet.has(path.resolve(p)),
    };
}

describe('resolvePagesRequest', () => {
    const distRoot = path.resolve('/repo/dist');
    const fsProbe = createMockFs(
        [
            path.join(distRoot, 'index.html'),
            path.join(distRoot, 'game', 'index.html'),
            path.join(distRoot, 'game', 'assets', 'main.js'),
        ],
        [distRoot, path.join(distRoot, 'game'), path.join(distRoot, 'game', 'assets')],
    );

    it('redirects root / and sub-path without trailing slash to PAGES_BASE_PATH', () => {
        expect(resolvePagesRequest('/', distRoot, fsProbe)).toEqual({
            kind: 'redirect',
            location: PAGES_BASE_PATH,
        });
        expect(resolvePagesRequest('/oXyFlow.VibrantCastle', distRoot, fsProbe)).toEqual({
            kind: 'redirect',
            location: PAGES_BASE_PATH,
        });
    });

    it('resolves directory requests to index.html', () => {
        expect(resolvePagesRequest('/oXyFlow.VibrantCastle/', distRoot, fsProbe)).toEqual({
            kind: 'file',
            filePath: path.join(distRoot, 'index.html'),
        });
        expect(resolvePagesRequest('/oXyFlow.VibrantCastle/game', distRoot, fsProbe)).toEqual({
            kind: 'file',
            filePath: path.join(distRoot, 'game', 'index.html'),
        });
        expect(resolvePagesRequest('/oXyFlow.VibrantCastle/game/', distRoot, fsProbe)).toEqual({
            kind: 'file',
            filePath: path.join(distRoot, 'game', 'index.html'),
        });
    });

    it('resolves existing static files', () => {
        expect(
            resolvePagesRequest('/oXyFlow.VibrantCastle/game/assets/main.js', distRoot, fsProbe),
        ).toEqual({
            kind: 'file',
            filePath: path.join(distRoot, 'game', 'assets', 'main.js'),
        });
    });

    it('returns not_found for missing files (no SPA fallback)', () => {
        expect(
            resolvePagesRequest('/oXyFlow.VibrantCastle/missing-page', distRoot, fsProbe),
        ).toEqual({ kind: 'not_found' });
        expect(
            resolvePagesRequest('/oXyFlow.VibrantCastle/game/assets/', distRoot, fsProbe),
        ).toEqual({ kind: 'not_found' });
    });

    it('returns not_found for paths outside PAGES_BASE_PATH or path traversal', () => {
        expect(resolvePagesRequest('/other/index.html', distRoot, fsProbe)).toEqual({
            kind: 'not_found',
        });
        expect(
            resolvePagesRequest('/oXyFlow.VibrantCastle/../../etc/passwd', distRoot, fsProbe),
        ).toEqual({ kind: 'not_found' });
        expect(resolvePagesRequest('/oXyFlow.VibrantCastle/%E0%A4%A', distRoot, fsProbe)).toEqual({
            kind: 'not_found',
        });
    });
});
