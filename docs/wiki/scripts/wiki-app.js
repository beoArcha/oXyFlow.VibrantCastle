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
  launchGame() {
    if (!this.dom.gameFrame) return;

    this.isGameStarted = true;
    const gameSrc = this.resolveGameUrl();
    this.dom.gameFrame.src = gameSrc;

    if (this.dom.viewportSplash) {
      this.dom.viewportSplash.classList.add('hidden');
    }

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
    if (urlParams.has('gameUrl')) {
      return urlParams.get('gameUrl') || '';
    }

    // Hosted on GitHub Pages: game bundle is in the ./game/ subdirectory
    if (window.location.hostname.includes('github.io')) {
      return './game/index.html';
    }

    // Local Vite dev server on port 3000
    if (window.location.port === '3000') {
      return '/';
    }

    // Local file preview fallback
    return '../../index.html';
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
          this.dom.btnFullscreen.textContent = '✕';
          this.dom.btnFullscreen.title = wikiI18n.t('wikiExitFullscreen');
        }
      } else {
        await document.exitFullscreen();
        if (this.dom.btnFullscreen) {
          this.dom.btnFullscreen.textContent = '⛶';
          this.dom.btnFullscreen.title = wikiI18n.t('wikiFullscreen');
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
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
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
