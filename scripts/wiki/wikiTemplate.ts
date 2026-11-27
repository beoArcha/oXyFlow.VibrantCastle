import { WIKI_DICTIONARIES } from "./wikiContent";

const REPO_URL = "https://github.com/beoArcha/oXyFlow.VibrantCastle";
const REPO_DOCS_URL = `${REPO_URL}/blob/main/docs/README.md`;
const REPO_ISSUES_URL = `${REPO_URL}/issues`;

/**
 * Generates the lifted GitHub Pages Gothic Wiki landing HTML.
 * Satisfies all E2E buildSmoke.test.ts invariants:
 * - <!doctype html>, Vibrant Castle title, icon link
 * - styles/wiki.css and scripts/wiki-app.js
 * - id="game-viewport" with allow="fullscreen" (and never autoplay)
 * - id="viewport-splash"
 */
export function renderWikiIndexHtml(): string {
  const pl = WIKI_DICTIONARIES.pl;

  return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pl.siteTitle}</title>
    <meta name="description" content="${pl.wikiSplashLead}" />
    <meta property="og:title" content="${pl.siteTitle}" />
    <meta property="og:description" content="${pl.wikiSplashLead}" />
    <meta property="og:type" content="website" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏰</text></svg>" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" />
    <link rel="stylesheet" href="styles/wiki.css" />
  </head>
  <body>
    <header class="wiki-header">
      <div class="wiki-header-inner">
        <a href="#game" class="wiki-brand" data-section-btn="game">Vibrant Castle</a>

        <nav class="wiki-nav" aria-label="Wiki sections">
          <button type="button" class="wiki-nav-link" data-section-btn="game" aria-current="page" data-i18n="wikiNavGame">${pl.wikiNavGame}</button>
          <button type="button" class="wiki-nav-link" data-section-btn="intro" data-i18n="wikiTabIntro">${pl.wikiTabIntro}</button>
          <button type="button" class="wiki-nav-link" data-section-btn="characters" data-i18n="wikiTabCharacters">${pl.wikiTabCharacters}</button>
          <button type="button" class="wiki-nav-link" data-section-btn="world" data-i18n="wikiTabWorld">${pl.wikiTabWorld}</button>
          <button type="button" class="wiki-nav-link" data-section-btn="bestiary" data-i18n="wikiTabBestiary">${pl.wikiTabBestiary}</button>
          <button type="button" class="wiki-nav-link" data-section-btn="controls" data-i18n="wikiTabControls">${pl.wikiTabControls}</button>
          <button type="button" class="wiki-nav-link" data-section-btn="graphics" data-i18n="wikiTabGraphics">${pl.wikiTabGraphics}</button>
          <button type="button" class="wiki-nav-link" data-section-btn="architecture" data-i18n="wikiTabArchitecture">${pl.wikiTabArchitecture}</button>
          <button type="button" class="wiki-nav-link" data-section-btn="news" data-i18n="wikiTabNews">${pl.wikiTabNews}</button>
        </nav>

        <div class="wiki-header-actions">
          <div class="lang-switch" role="group" aria-label="Language">
            <button type="button" class="lang-btn" data-lang-btn="pl" aria-pressed="true">PL</button>
            <button type="button" class="lang-btn" data-lang-btn="en" aria-pressed="false">EN</button>
          </div>
          <button type="button" id="btn-header-play" class="btn-primary" data-i18n="wikiLaunchCta">${pl.wikiLaunchCta}</button>
        </div>
      </div>
    </header>

    <main class="wiki-main">
      <section id="section-game" aria-label="Game viewport">
        <div class="stage-toolbar">
          <span class="stage-meta" data-i18n="wikiSplashMeta">${pl.wikiSplashMeta}</span>
          <div class="stage-controls">
            <button type="button" id="btn-fullscreen" class="btn-secondary" data-i18n="wikiFullscreen">${pl.wikiFullscreen}</button>
            <button type="button" id="btn-reload-game" class="btn-secondary" data-i18n="wikiReloadGame">${pl.wikiReloadGame}</button>
            <a href="./game/index.html" class="btn-secondary" data-i18n="wikiOpenDirect">${pl.wikiOpenDirect}</a>
          </div>
        </div>

        <div id="viewport-shell" class="viewport-frame">
          <iframe
            id="game-viewport"
            class="viewport-iframe"
            title="Vibrant Castle Game"
            allow="fullscreen"
          ></iframe>

          <div id="viewport-splash" class="viewport-splash">
            <p class="splash-eyebrow" data-i18n="wikiSplashEyebrow">${pl.wikiSplashEyebrow}</p>
            <h1 class="splash-title" data-i18n="wikiSplashTitle">${pl.wikiSplashTitle}</h1>
            <p class="splash-lead" data-i18n="wikiSplashLead">${pl.wikiSplashLead}</p>
            <button type="button" id="btn-launch-game" class="btn-primary splash-cta" data-i18n="wikiLaunchCta">${pl.wikiLaunchCta}</button>
          </div>
        </div>

        <div class="champions-strip">
          <article class="champion-block champion-block--solar">
            <div class="champion-header">
              <h2 class="champion-name">Valen</h2>
              <span class="champion-meta"><span data-i18n="wikiHeroValenRole">${pl.wikiHeroValenRole}</span> · <span data-i18n="wikiHeroValenPassive">${pl.wikiHeroValenPassive}</span></span>
            </div>
            <p class="champion-summary" data-i18n="wikiHeroValenSummary">${pl.wikiHeroValenSummary}</p>
          </article>

          <article class="champion-block champion-block--astral">
            <div class="champion-header">
              <h2 class="champion-name">Aurelia</h2>
              <span class="champion-meta"><span data-i18n="wikiHeroAureliaRole">${pl.wikiHeroAureliaRole}</span> · <span data-i18n="wikiHeroAureliaPassive">${pl.wikiHeroAureliaPassive}</span></span>
            </div>
            <p class="champion-summary" data-i18n="wikiHeroAureliaSummary">${pl.wikiHeroAureliaSummary}</p>
          </article>
        </div>
      </section>

      <section id="section-article" class="article-shell panel-hidden" aria-live="polite">
        <div class="article-topbar">
          <button type="button" id="btn-back-to-game" class="btn-secondary" data-i18n="wikiReturnToGame">${pl.wikiReturnToGame}</button>
        </div>
        <article id="article-content" class="markdown-body"></article>
      </section>
    </main>

    <footer class="wiki-footer">
      <nav class="wiki-footer-links" aria-label="Links">
        <a href="./game/index.html" data-i18n="wikiPlayGameLink">${pl.wikiPlayGameLink}</a>
        <a href="${REPO_DOCS_URL}" target="_blank" rel="noopener noreferrer" data-i18n="wikiRepoDocsLink">${pl.wikiRepoDocsLink}</a>
        <a href="${REPO_URL}" target="_blank" rel="noopener noreferrer" data-i18n="wikiFooterRepo">${pl.wikiFooterRepo}</a>
        <a href="${REPO_ISSUES_URL}" target="_blank" rel="noopener noreferrer" data-i18n="wikiFooterIssues">${pl.wikiFooterIssues}</a>
      </nav>
      <span data-i18n="wikiFooterCopyright">${pl.wikiFooterCopyright}</span>
    </footer>

    <script src="scripts/wiki-app.js" defer></script>
  </body>
</html>
`;
}
