/**
 * Interactive client runtime for the Vibrant Castle GitHub Pages Wiki portal.
 * Handles PL/EN localization, lazy game iframe mounting, fullscreen control,
 * and zero-dependency Markdown chronicle rendering.
 */
import { WIKI_MARKDOWN_JS } from "./wikiMarkdown";

export const WIKI_APP_SCRIPT_JS = `(function () {
  "use strict";

  const STORAGE_KEY = "vibrant_castle_wiki_lang";
  const GAME_ENTRY_URL = "./game/index.html";
  const SECTION_TO_DOC = {
    intro: "intro.md",
    characters: "characters.md",
    world: "world.md",
    bestiary: "bestiary.md",
    controls: "controls.md",
    graphics: "graphics.md",
    architecture: "architecture.md",
    news: "news.md",
  };

  let currentLang = readSavedLanguage();
  let currentSection = "game";
  let isGameLaunched = false;
  let dictCache = {};

  function readSavedLanguage() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "pl" || saved === "en") return saved;
    } catch (_err) {
      // Ignore storage access errors in private contexts
    }
    const navLang = (navigator.language || "pl").toLowerCase();
    return navLang.startsWith("pl") ? "pl" : "en";
  }

  function saveLanguage(lang) {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (_err) {
      // Ignore storage errors
    }
  }

  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  ${WIKI_MARKDOWN_JS}

  async function loadDictionary(lang) {
    if (dictCache[lang]) return dictCache[lang];
    const response = await fetch("./i18n/" + lang + ".json");
    if (!response.ok) throw new Error("Failed to load i18n dictionary");
    const data = await response.json();
    dictCache[lang] = data;
    return data;
  }

  function applyDictionary(dict) {
    document.documentElement.lang = currentLang;
    if (dict.siteTitle) document.title = dict.siteTitle;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key && dict[key]) {
        el.textContent = dict[key];
      }
    });

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      const btnLang = btn.getAttribute("data-lang-btn");
      btn.setAttribute("aria-pressed", btnLang === currentLang ? "true" : "false");
    });
  }

  async function loadArticle(section) {
    const docName = SECTION_TO_DOC[section];
    const bodyEl = document.getElementById("article-content");
    if (!docName || !bodyEl) return;

    const dict = dictCache[currentLang] || {};
    bodyEl.innerHTML =
      '<p class="article-status">' +
      escapeHtml(dict.wikiLoadingArticle || "Loading...") +
      "</p>";

    try {
      const res = await fetch("./" + currentLang + "/" + docName);
      if (!res.ok) throw new Error("Article HTTP " + res.status);
      const md = await res.text();
      bodyEl.innerHTML = renderMarkdown(md);
    } catch (_err) {
      bodyEl.innerHTML =
        '<p class="article-status">' +
        escapeHtml(dict.wikiErrorArticle || "Could not load chapter.") +
        "</p>";
    }
  }

  function updateSectionVisibility(section) {
    currentSection = section;
    const gamePanel = document.getElementById("section-game");
    const articlePanel = document.getElementById("section-article");

    if (section === "game") {
      gamePanel && gamePanel.classList.remove("panel-hidden");
      articlePanel && articlePanel.classList.add("panel-hidden");
    } else {
      gamePanel && gamePanel.classList.add("panel-hidden");
      articlePanel && articlePanel.classList.remove("panel-hidden");
      loadArticle(section);
    }

    document.querySelectorAll("[data-section-btn]").forEach((btn) => {
      const target = btn.getAttribute("data-section-btn");
      if (target === section) {
        btn.setAttribute("aria-current", "page");
      } else {
        btn.removeAttribute("aria-current");
      }
    });
  }

  function isEmbeddedInIframe() {
    try {
      return window.self !== window.top;
    } catch (_err) {
      return true;
    }
  }

  function renderEmbeddedFallback() {
    const iframe = document.getElementById("game-viewport");
    if (iframe) iframe.remove();

    const launchBtn = document.getElementById("btn-launch-game");
    if (launchBtn && launchBtn.parentNode) {
      const link = document.createElement("a");
      link.id = "btn-open-game-direct";
      link.href = GAME_ENTRY_URL;
      link.target = "_top";
      link.rel = "noopener noreferrer";
      link.className = "btn-primary splash-cta";
      link.setAttribute("data-i18n", "wikiOpenDirect");
      link.textContent = currentLang === "pl" ? "Otwórz samą grę" : "Open standalone";
      launchBtn.parentNode.replaceChild(link, launchBtn);
    }
  }

  function launchGame(forceReload) {
    if (isEmbeddedInIframe()) return;
    const iframe = document.getElementById("game-viewport");
    const splash = document.getElementById("viewport-splash");
    if (!iframe) return;

    if (!isGameLaunched || forceReload) {
      iframe.setAttribute(
        "src",
        forceReload ? GAME_ENTRY_URL + "?t=" + Date.now() : GAME_ENTRY_URL
      );
      isGameLaunched = true;
    }

    if (splash) {
      splash.classList.add("is-launched");
    }
    iframe.focus();
  }

  function requestFullscreen() {
    const frame = document.getElementById("viewport-shell");
    if (!frame) return;
    if (!isGameLaunched) launchGame(false);

    if (document.fullscreenElement) {
      document.exitFullscreen && document.exitFullscreen();
    } else if (frame.requestFullscreen) {
      frame.requestFullscreen();
    }
  }

  async function setLanguage(lang) {
    if (lang !== "pl" && lang !== "en") return;
    currentLang = lang;
    saveLanguage(lang);
    try {
      const dict = await loadDictionary(lang);
      applyDictionary(dict);
    } catch (_err) {
      // Keep fallback labels rendered in HTML
    }
    if (currentSection !== "game") {
      await loadArticle(currentSection);
    }
  }

  function bindEvents() {
    document.querySelectorAll("[data-section-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-section-btn");
        if (target) updateSectionVisibility(target);
      });
    });

    document.querySelectorAll("[data-lang-btn]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-lang-btn");
        if (target) setLanguage(target);
      });
    });

    const launchBtn = document.getElementById("btn-launch-game");
    if (launchBtn) {
      launchBtn.addEventListener("click", () => launchGame(false));
    }

    const headerPlayBtn = document.getElementById("btn-header-play");
    if (headerPlayBtn) {
      headerPlayBtn.addEventListener("click", () => {
        updateSectionVisibility("game");
        launchGame(false);
      });
    }

    const fullscreenBtn = document.getElementById("btn-fullscreen");
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener("click", requestFullscreen);
    }

    const reloadBtn = document.getElementById("btn-reload-game");
    if (reloadBtn) {
      reloadBtn.addEventListener("click", () => launchGame(true));
    }

    const backBtn = document.getElementById("btn-back-to-game");
    if (backBtn) {
      backBtn.addEventListener("click", () => updateSectionVisibility("game"));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (isEmbeddedInIframe()) {
      renderEmbeddedFallback();
    }
    bindEvents();
    updateSectionVisibility("game");
    setLanguage(currentLang);
  });
})();
`;
