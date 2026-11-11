/**
 * Vibrant Castle Wiki — Master Application Coordinator
 * Manages language switching, dynamic markdown article loading, and game viewport lifecycle.
 */

import { wikiI18n } from './i18n.js';
import { gothicMarkdownRenderer } from './markdown-renderer.js';

class WikiApp {
  constructor() {
    this.currentDocTab = 'intro';
    this.isGameStarted = false;
    this.dom = {};
  }

  /**
   * Initializes DOM element references and sets up event listeners.
   */
  async init() {
    this.cacheDom();
    this.bindEvents();

    // Initialize internationalization engine and translate UI
    await wikiI18n.init();

    // Load initial documentation article based on active language
    await this.loadActiveDocArticle();
  }

  cacheDom() {
    this.dom.langButtons = document.querySelectorAll('[data-lang-btn]');
    this.dom.docTabs = document.querySelectorAll('[data-doc-tab]');
    this.dom.markdownViewer = document.getElementById('markdown-viewer');
    this.dom.viewportSplash = document.getElementById('viewport-splash');
    this.dom.btnStartGame = document.getElementById('btn-start-game');
    this.dom.btnFullscreen = document.getElementById('btn-fullscreen');
    this.dom.gameFrame = document.getElementById('game-frame');
    this.dom.stageWrapper = document.getElementById('stage-wrapper');
    this.dom.gameStatusBadge = document.getElementById('game-status-badge');
    this.dom.footerStatusText = document.getElementById('footer-status-text');
    this.dom.fullscreenGlyph = document.getElementById('fullscreen-glyph');
    this.dom.gameFallback = document.getElementById('game-fallback');
  }

  bindEvents() {
    // Language Switcher buttons
    for (const btn of this.dom.langButtons) {
      btn.addEventListener('click', () => {
        const targetLang = btn.getAttribute('data-lang-btn');
        if (targetLang) {
          wikiI18n.setLanguage(targetLang);
        }
      });
    }

    // Re-render active article when language changes
    wikiI18n.onLanguageChange(async () => {
      await this.loadActiveDocArticle();
      this.updateViewportStatus();
    });

    // Knowledge Vault Sidebar Tabs
    for (const tab of this.dom.docTabs) {
      tab.addEventListener('click', async () => {
        const targetTab = tab.getAttribute('data-doc-tab');
        if (targetTab && targetTab !== this.currentDocTab) {
          this.switchDocTab(targetTab);
          await this.loadActiveDocArticle();
        }
      });
    }

    // Start Game Button in Viewport Splash
    if (this.dom.btnStartGame) {
      this.dom.btnStartGame.addEventListener('click', () => {
        this.launchGame();
      });
    }

    // Fullscreen Toggle
    if (this.dom.btnFullscreen) {
      this.dom.btnFullscreen.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    // Ensure keyboard focus transfers to the game iframe on stage click
    if (this.dom.stageWrapper) {
      this.dom.stageWrapper.addEventListener('click', () => {
        if (this.isGameStarted && this.dom.gameFrame) {
          this.dom.gameFrame.focus();
        }
      });
    }
  }

  /**
   * Activates the game iframe and hides the pre-game splash overlay.
   */
  async launchGame() {
    if (!this.dom.gameFrame) return;

    const gameSrc = this.resolveGameUrl();
    if (this.dom.viewportSplash) {
      this.dom.viewportSplash.classList.add('hidden');
    }

    // Verify the game is reachable first, so a missing build shows a text fallback instead of a blank frame.
    let reachable = false;
    try {
      const response = await fetch(gameSrc, { method: 'GET', cache: 'no-store' });
      reachable = response.ok;
    } catch {
      reachable = false;
    }

    if (!reachable) {
      if (this.dom.gameFallback) this.dom.gameFallback.classList.remove('hidden');
      this.dom.gameFrame.setAttribute('hidden', '');
      return;
    }

    this.isGameStarted = true;
    this.dom.gameFrame.src = gameSrc;

    this.updateViewportStatus();

    // Yield execution briefly before requesting iframe focus
    setTimeout(() => {
      if (this.dom.gameFrame) {
        this.dom.gameFrame.focus();
      }
    }, 150);
  }

  /**
   * Resolves the relative path to the compiled game based on hosting environment.
   */
  resolveGameUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const override = urlParams.get('gameUrl');
    if (override) {
      // Only same-origin targets are accepted, so the query string cannot inject foreign content.
      try {
        const target = new URL(override, window.location.href);
        if (target.origin === window.location.origin) return target.href;
      } catch {
        // fall through to the default
      }
    }

    // Local Vite dev server on port 3000 serves the game at the root
    if (window.location.port === '3000') {
      return '/';
    }

    // Assembled distribution (GitHub Pages or any static host): game bundle is in ./game/
    return './game/index.html';
  }

  /**
   * Updates status badge labels based on simulation state.
   */
  updateViewportStatus() {
    const statusKey = this.isGameStarted ? 'wikiGameActiveStatus' : 'wikiClickToFocus';
    const localizedStatus = wikiI18n.t(statusKey);

    if (this.dom.gameStatusBadge) {
      this.dom.gameStatusBadge.textContent = localizedStatus;
    }
    if (this.dom.footerStatusText) {
      this.dom.footerStatusText.textContent = localizedStatus;
    }
  }

  /**
   * Toggles native browser fullscreen mode on the viewport stage.
   */
  async toggleFullscreen() {
    const stage = this.dom.stageWrapper;
    if (!stage) return;

    try {
      if (!document.fullscreenElement) {
        await stage.requestFullscreen();
        if (this.dom.btnFullscreen) {
          if (this.dom.fullscreenGlyph) this.dom.fullscreenGlyph.textContent = '✕';
          this.dom.btnFullscreen.title = wikiI18n.t('wikiExitFullscreen');
          this.dom.btnFullscreen.setAttribute('aria-label', wikiI18n.t('wikiExitFullscreen'));
        }
      } else {
        await document.exitFullscreen();
        if (this.dom.btnFullscreen) {
          if (this.dom.fullscreenGlyph) this.dom.fullscreenGlyph.textContent = '⛶';
          this.dom.btnFullscreen.title = wikiI18n.t('wikiFullscreen');
          this.dom.btnFullscreen.setAttribute('aria-label', wikiI18n.t('wikiFullscreen'));
        }
      }
    } catch (err) {
      console.warn('[WikiApp] Fullscreen transition error:', err);
    }
  }

  /**
   * Updates active state classes and ARIA attributes across sidebar tab buttons.
   */
  switchDocTab(tabId) {
    this.currentDocTab = tabId;
    for (const tab of this.dom.docTabs) {
      const match = tab.getAttribute('data-doc-tab') === tabId;
      if (match) {
        tab.classList.add('active');
        tab.setAttribute('aria-current', 'true');
      } else {
        tab.classList.remove('active');
        tab.removeAttribute('aria-current');
      }
    }
  }

  /**
   * Loads the markdown file for the active tab and current language, then renders to DOM.
   */
  async loadActiveDocArticle() {
    if (!this.dom.markdownViewer) return;

    const lang = wikiI18n.getLanguage();
    const docPath = `./${lang}/${this.currentDocTab}.md`;

    await gothicMarkdownRenderer.fetchAndRender(docPath, this.dom.markdownViewer);
  }
}

// Bootstrap application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new WikiApp();
  app.init().catch((err) => {
    console.error('[WikiApp] Initialization failed:', err);
  });
});
