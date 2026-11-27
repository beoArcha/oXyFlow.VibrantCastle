# Parallax visual review

One command captures every map's parallax background and writes a gallery page.

```bash
bun run review:parallax
```

Output: `dist-review/index.html` (git-ignored). Open it in a browser.

## What it does

1. Starts the Vite dev server in-process on a free `127.0.0.1` port.
2. Opens each of the 8 maps through the dev-only `?vcReview` hook
   (`src/app/reviewHook.ts`, installed from `src/main.tsx` in `DEV` builds only).
3. For each map and viewport, captures three camera positions:
   * `start`: right after the map loads;
   * `middle`: after holding ArrowRight for 3 s;
   * `goal`: player moved to the right-hand end of the map.
4. Viewports: desktop 1920x1080, laptop 1440x900, tablet 1024x768 at DPR 2.
5. Records a clip per map at desktop (`dist-review/clips/<map>.webm`).
   The clip starts at map load, so the 3 s hold-right sits inside it.
6. Writes the gallery: rows are maps, columns are viewport x position.
   The header shows the commit SHA and the generation time.

Output layout:

```
dist-review/
  index.html
  shots/<map>/<viewport>-<position>.png
  clips/<map>.webm
```

## Browser

Playwright (`playwright-core`) drives Chromium. The executable is chosen as follows:

* `PLAYWRIGHT_CHROMIUM_PATH`, when set;
* on Windows, `%LOCALAPPDATA%\ms-playwright\chromium-1248\chrome-win64\chrome.exe`;
* elsewhere, Playwright's default browser.

## Limits

* Dev server only. The review hook is compiled out of production builds.
* Captures run sequentially: 8 maps x 3 viewports, a few minutes in total.
* The gallery reflects the working tree at run time, not a committed build.
