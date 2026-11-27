import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

declare const Bun: {
    serve: (options: {
        port: number;
        fetch: (req: Request) => Response | Promise<Response>;
    }) => { port: number };
    file: (filePath: string) => BodyInit;
};

export const PAGES_BASE_PATH = '/oXyFlow.VibrantCastle/';

export type PagesRouteResult =
    | { kind: 'redirect'; location: string }
    | { kind: 'file'; filePath: string }
    | { kind: 'not_found' };

export interface FsProbe {
    exists: (filePath: string) => boolean;
    isDirectory: (filePath: string) => boolean;
}

const defaultFsProbe: FsProbe = {
    exists: (filePath) => existsSync(filePath),
    isDirectory: (filePath) => {
        try {
            return statSync(filePath).isDirectory();
        } catch {
            return false;
        }
    },
};

export function resolvePagesRequest(
    pathname: string,
    distRoot: string,
    fsProbe: FsProbe = defaultFsProbe,
): PagesRouteResult {
    let decodedPath: string;
    try {
        decodedPath = decodeURIComponent(pathname);
    } catch {
        return { kind: 'not_found' };
    }

    if (decodedPath === '/' || decodedPath === PAGES_BASE_PATH.slice(0, -1)) {
        return { kind: 'redirect', location: PAGES_BASE_PATH };
    }

    if (!decodedPath.startsWith(PAGES_BASE_PATH)) {
        return { kind: 'not_found' };
    }

    const relativePath = decodedPath.slice(PAGES_BASE_PATH.length);
    const resolvedRoot = path.resolve(distRoot);
    const candidate = path.resolve(resolvedRoot, relativePath);

    if (candidate !== resolvedRoot && !candidate.startsWith(resolvedRoot + path.sep)) {
        return { kind: 'not_found' };
    }

    if (fsProbe.isDirectory(candidate)) {
        const indexPath = path.join(candidate, 'index.html');
        return fsProbe.exists(indexPath)
            ? { kind: 'file', filePath: indexPath }
            : { kind: 'not_found' };
    }

    if (fsProbe.exists(candidate)) {
        return { kind: 'file', filePath: candidate };
    }

    return { kind: 'not_found' };
}

function parsePort(raw: string | undefined): number {
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : 4173;
}

if (import.meta.main) {
    const port = parsePort(process.argv[2] ?? process.env.PORT);
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const distRoot = path.resolve(currentDir, '../dist');

    const server = Bun.serve({
        port,
        fetch(req: Request) {
            const url = new URL(req.url);
            const result = resolvePagesRequest(url.pathname, distRoot);

            if (result.kind === 'redirect') {
                return Response.redirect(new URL(result.location, url.origin).toString(), 302);
            }

            if (result.kind === 'not_found') {
                return new Response('Not Found', { status: 404 });
            }

            return new Response(Bun.file(result.filePath));
        },
    });

    console.log(`Previewing GitHub Pages at http://localhost:${server.port}${PAGES_BASE_PATH}`);
}
