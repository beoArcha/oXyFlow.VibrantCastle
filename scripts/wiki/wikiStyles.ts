/**
 * Editorial Gothic Dark Fantasy stylesheet for the Vibrant Castle GitHub Pages Wiki portal.
 * Enforces 60-30-10 color balance, Cinzel + Plus Jakarta Sans typography,
 * single-row 3-zone top bar, zero pill clutter, and comfortable 68ch reading columns.
 */
export const WIKI_STYLES_CSS = `:root {
  --bg-canvas: #120602;
  --bg-elevated: #1b0c06;
  --bg-surface: #241109;
  --border-hairline: rgba(217, 119, 6, 0.22);
  --border-subtle: rgba(168, 162, 158, 0.16);
  --text-primary: #f5efe6;
  --text-secondary: #cbbba8;
  --text-muted: #968372;
  --accent-solar: #f59e0b;
  --accent-solar-soft: #fcd34d;
  --accent-astral: #38bdf8;
  --accent-violet: #c084fc;
  --font-display: "Cinzel", Georgia, "Times New Roman", serif;
  --font-body: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
  --font-mono: "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background:
    radial-gradient(ellipse 80% 45% at 50% -10%, rgba(180, 83, 9, 0.22), transparent 65%),
    var(--bg-canvas);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--accent-solar-soft);
  text-decoration-color: rgba(252, 211, 77, 0.35);
  text-underline-offset: 3px;
}

a:hover {
  color: #fff;
}

button {
  font-family: inherit;
  cursor: pointer;
}

:focus-visible {
  outline: 2px solid var(--accent-solar);
  outline-offset: 2px;
}

/* ── Top Bar (3-zone single-row contract) ─────────────────────── */
.wiki-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(18, 6, 2, 0.92);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-hairline);
}

.wiki-header-inner {
  max-width: 1240px;
  margin: 0 auto;
  height: 58px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.wiki-brand {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--accent-solar-soft);
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.wiki-nav {
  display: flex;
  align-items: center;
  gap: 20px;
  overflow-x: auto;
  scrollbar-width: none;
}

.wiki-nav::-webkit-scrollbar {
  display: none;
}

.wiki-nav-link {
  position: relative;
  background: transparent;
  border: 0;
  padding: 6px 2px;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  transition: color 160ms ease;
}

.wiki-nav-link:hover {
  color: var(--text-primary);
}

.wiki-nav-link[aria-current="page"] {
  color: var(--accent-solar-soft);
}

.wiki-nav-link[aria-current="page"]::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 2px;
  background: var(--accent-solar);
}

.wiki-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.lang-switch {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
}

.lang-btn {
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 6px;
  white-space: nowrap;
  transition: background-color 150ms ease, color 150ms ease;
}

.lang-btn[aria-pressed="true"] {
  background: rgba(245, 158, 11, 0.2);
  color: var(--accent-solar-soft);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid rgba(251, 191, 36, 0.45);
  background: linear-gradient(180deg, #d97706 0%, #b45309 100%);
  color: #fffaf0;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  transition: transform 150ms ease, filter 150ms ease;
}

.btn-primary:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: border-color 150ms ease, color 150ms ease;
}

.btn-secondary:hover {
  border-color: var(--border-hairline);
  color: var(--text-primary);
}

/* ── Main Container ───────────────────────────────────────────── */
.wiki-main {
  max-width: 1240px;
  margin: 0 auto;
  padding: 28px 20px 56px;
}

.panel-hidden {
  display: none !important;
}

/* ── Game Stage Shell ─────────────────────────────────────────── */
.stage-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.stage-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
  letter-spacing: 0.01em;
}

.stage-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.viewport-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 420px;
  max-height: 76vh;
  background: #090301;
  border: 1px solid var(--border-hairline);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}

.viewport-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #090301;
}

.viewport-splash {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px;
  background:
    radial-gradient(circle at 50% 30%, rgba(217, 119, 6, 0.2), transparent 58%),
    linear-gradient(180deg, rgba(24, 10, 5, 0.94) 0%, rgba(12, 4, 2, 0.98) 100%);
  transition: opacity 200ms ease;
}

.viewport-splash.is-launched {
  opacity: 0;
  pointer-events: none;
}

.splash-eyebrow {
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  color: var(--accent-solar);
  margin: 0 0 8px;
}

.splash-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3.25rem);
  font-weight: 700;
  line-height: 1.1;
  margin: 0 0 14px;
  color: var(--text-primary);
  text-wrap: balance;
}

.splash-lead {
  max-width: 56ch;
  margin: 0 0 24px;
  color: var(--text-secondary);
  font-size: 0.98rem;
}

.splash-cta {
  padding: 12px 28px;
  font-size: 0.95rem;
}

/* ── Champions Unboxed Lore Strip ─────────────────────────────── */
.champions-strip {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid var(--border-subtle);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.champion-block {
  padding: 18px 20px;
  border-radius: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
}

.champion-block--solar {
  border-color: rgba(245, 158, 11, 0.28);
}

.champion-block--astral {
  border-color: rgba(56, 189, 248, 0.28);
}

.champion-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.champion-name {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.champion-block--solar .champion-name {
  color: var(--accent-solar-soft);
}

.champion-block--astral .champion-name {
  color: #bae6fd;
}

.champion-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.champion-summary {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

/* ── Editorial Chronicle Article View ─────────────────────────── */
.article-shell {
  max-width: 72ch;
  margin: 0 auto;
  padding: 8px 0 24px;
}

.article-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-subtle);
}

.markdown-body h1 {
  font-family: var(--font-display);
  font-size: clamp(1.85rem, 3vw, 2.4rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--accent-solar-soft);
  margin: 0 0 18px;
  text-wrap: balance;
}

.markdown-body h2 {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 32px 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.markdown-body p {
  margin: 0 0 16px;
  color: var(--text-secondary);
}

.markdown-body ul {
  margin: 0 0 18px;
  padding-left: 20px;
  color: var(--text-secondary);
}

.markdown-body li {
  margin-bottom: 8px;
}

.markdown-body strong {
  color: var(--text-primary);
  font-weight: 600;
}

.markdown-body code {
  font-family: var(--font-mono);
  font-size: 0.84em;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--accent-solar-soft);
}

.markdown-body blockquote {
  margin: 20px 0;
  padding: 14px 4px;
  border-top: 1px solid var(--border-hairline);
  border-bottom: 1px solid var(--border-hairline);
  font-family: var(--font-display);
  font-style: italic;
  color: #fde68a;
}

.markdown-body hr {
  border: 0;
  border-top: 1px solid var(--border-subtle);
  margin: 28px 0;
}

.markdown-body table {
  width: 100%;
  border-collapse: collapse;
  margin: 18px 0 24px;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
}

.markdown-body th,
.markdown-body td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-subtle);
}

.markdown-body th {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 600;
}

.markdown-body td {
  color: var(--text-secondary);
}

.article-status {
  color: var(--text-muted);
  padding: 24px 0;
}

/* ── Footer ───────────────────────────────────────────────────── */
.wiki-footer {
  max-width: 1240px;
  margin: 0 auto;
  padding: 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .wiki-header-inner {
    height: 52px;
    gap: 12px;
  }

  .wiki-nav {
    gap: 14px;
  }

  .champions-strip {
    grid-template-columns: 1fr;
  }

  .viewport-frame {
    min-height: 300px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
`;
