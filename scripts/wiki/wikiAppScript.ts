/**
 * Interactive client runtime for the Vibrant Castle GitHub Pages Wiki portal.
 * Handles PL/EN localization, lazy game iframe mounting, fullscreen control,
 * and zero-dependency Markdown chronicle rendering.
 */
export const WIKI_APP_SCRIPT_JS = `(function () {
  "use strict";

  const STORAGE_KEY = "vibrant_castle_wiki_lang";
  const GAME_ENTRY_URL = "./game/index.html";
  const SECTION_TO_DOC = {
    intro: "intro.md",
    heroes: "heroes.md",
    worlds: "worlds.md",
    controls: "controls.md",
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

  function renderInline(raw) {
    let out = escapeHtml(raw);
    out = out.replace(/\`([^\`]+)\`/g, "<code>$1</code>");
    out = out.replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>");
    out = out.replace(/\\*([^*]+)\\*/g, "<em>$1</em>");
    return out;
  }

  function renderMarkdown(md) {
    const lines = md.replace(/\\r\\n/g, "\\n").split("\\n");
    const html = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) {
        i += 1;
        continue;
      }

      if (line === "---") {
        html.push("<hr />");
        i += 1;
        continue;
      }

      if (line.startsWith("# ")) {
        html.push("<h1>" + renderInline(line.slice(2)) + "</h1>");
        i += 1;
        continue;
      }

      if (line.startsWith("## ")) {
        html.push("<h2>" + renderInline(line.slice(3)) + "</h2>");
        i += 1;
        continue;
      }

      if (line.startsWith("> ")) {
        const quoteLines = [];
        while (i < lines.length && lines[i].trim().startsWith("> ")) {
          quoteLines.push(renderInline(lines[i].trim().slice(2)));
          i += 1;
        }
        html.push("<blockquote>" + quoteLines.join("<br />") + "</blockquote>");
        continue;
      }

      if (line.startsWith("|")) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          tableLines.push(lines[i].trim());
          i += 1;
        }
        if (tableLines.length >= 2) {
          const splitCells = (row) =>
            row
              .replace(/^\\|/, "")
              .replace(/\\|$/, "")
              .split("|")
              .map((c) => c.trim());

          const headers = splitCells(tableLines[0]);
          const bodyRows = tableLines.slice(2).map(splitCells);
          html.push("<table><thead><tr>");
          headers.forEach((h) => html.push("<th>" + renderInline(h) + "</th>"));
          html.push("</tr></thead><tbody>");
          bodyRows.forEach((cells) => {
            html.push("<tr>");
            cells.forEach((cell) => html.push("<td>" + renderInline(cell) + "</td>"));
            html.push("</tr>");
          });
          html.push("</tbody></table>");
          continue;
        }
      }

      if (line.startsWith("- ")) {
        html.push("<ul>");
        while (i < lines.length && lines[i].trim().startsWith("- ")) {
          html.push("<li>" + renderInline(lines[i].trim().slice(2)) + "</li>");
          i += 1;
        }
        html.push("</ul>");
        continue;
      }

      const paraLines = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].trim().startsWith("#") &&
        !lines[i].trim().startsWith("- ") &&
        !lines[i].trim().startsWith("> ") &&
        !lines[i].trim().startsWith("|") &&
        lines[i].trim() !== "---"
      ) {
        paraLines.push(renderInline(lines[i].trim()));
        i += 1;
      }
      html.push("<p>" + paraLines.join(" ") + "</p>");
    }

    return html.join("\\n");
  }

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

  function launchGame(forceReload) {
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
    bindEvents();
    updateSectionVisibility("game");
    setLanguage(currentLang);
  });
})();
`;
