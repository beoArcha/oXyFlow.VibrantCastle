/**
 * Vibrant Castle Wiki — Lightweight Client-Side i18n Engine
 * Autonomous translation manager supporting dynamic JSON dictionary loading.
 */

export class WikiI18n {
  constructor(options = {}) {
    this.defaultLanguage = options.defaultLanguage || 'pl';
    this.fallbackLanguage = options.fallbackLanguage || 'en';
    this.basePath = options.basePath || './i18n/';
    this.storageKey = 'vc_wiki_language';
    
    this.currentLanguage = this.detectInitialLanguage();
    this.dictionaries = new Map();
    this.listeners = new Set();
  }

  /**
   * Resolves the initial language from local storage, document lang, or fallback.
   */
  detectInitialLanguage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored && (stored === 'pl' || stored === 'en')) {
        return stored;
      }
    } catch {
      // LocalStorage might be inaccessible in restricted contexts
    }

    const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (navLang.startsWith('pl')) {
      return 'pl';
    }

    return this.defaultLanguage;
  }

  /**
   * Initializes the engine by loading the initial language dictionary.
   */
  async init() {
    await this.loadLanguage(this.currentLanguage);
    if (this.currentLanguage !== this.fallbackLanguage) {
      // Preload fallback asynchronously to avoid blocking
      this.loadLanguage(this.fallbackLanguage).catch(() => {});
    }
    this.translatePage();
    return this;
  }

  /**
   * Fetches and caches the JSON dictionary for a given language code.
   */
  async loadLanguage(lang) {
    if (this.dictionaries.has(lang)) {
      return this.dictionaries.get(lang);
    }

    const targetUrl = `${this.basePath}${lang}.json`;
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        console.warn(`[WikiI18n] Failed to fetch dictionary for "${lang}" from ${targetUrl}: HTTP ${response.status}`);
        return null;
      }
      const data = await response.json();
      this.dictionaries.set(lang, data);
      return data;
    } catch (err) {
      console.warn(`[WikiI18n] Error loading dictionary "${lang}":`, err);
      return null;
    }
  }

  /**
   * Switches the active language, updates storage, translates the DOM, and notifies listeners.
   */
  async setLanguage(lang) {
    if (lang === this.currentLanguage && this.dictionaries.has(lang)) {
      return;
    }

    await this.loadLanguage(lang);
    this.currentLanguage = lang;

    try {
      localStorage.setItem(this.storageKey, lang);
    } catch {
      // Ignored if storage is blocked
    }

    document.documentElement.lang = lang;
    this.translatePage();
    this.notifyListeners(lang);
  }

  /**
   * Returns current active language code.
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Translates a given key with optional string parameter interpolation.
   */
  t(key, params = {}) {
    const activeDict = this.dictionaries.get(this.currentLanguage);
    const fallbackDict = this.dictionaries.get(this.fallbackLanguage);

    let val = activeDict ? this.resolveKey(activeDict, key) : undefined;
    if (val === undefined && fallbackDict) {
      val = this.resolveKey(fallbackDict, key);
    }

    if (val === undefined) {
      return key;
    }

    // Replace {placeholder} parameters
    if (typeof val === 'string' && Object.keys(params).length > 0) {
      return val.replace(/\{(\w+)\}/g, (match, paramName) => {
        return params[paramName] !== undefined ? String(params[paramName]) : match;
      });
    }

    return val;
  }

  /**
   * Resolves nested dot-notation or flat key from dictionary.
   */
  resolveKey(dict, keyPath) {
    if (dict[keyPath] !== undefined) {
      return dict[keyPath];
    }

    const segments = keyPath.split('.');
    let curr = dict;
    for (const segment of segments) {
      if (curr === null || typeof curr !== 'object' || curr[segment] === undefined) {
        return undefined;
      }
      curr = curr[segment];
    }
    return curr;
  }

  /**
   * Scans DOM and translates all elements marked with [data-i18n].
   */
  translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    for (const el of elements) {
      const key = el.getAttribute('data-i18n');
      if (!key) continue;

      const translated = this.t(key);
      if (el.hasAttribute('data-i18n-html')) {
        el.innerHTML = translated;
      } else {
        el.textContent = translated;
      }
    }

    // Handle attribute translations (e.g. data-i18n-attr="placeholder:searchKey,title:toolTipKey")
    const attrElements = document.querySelectorAll('[data-i18n-attr]');
    for (const el of attrElements) {
      const attrRule = el.getAttribute('data-i18n-attr');
      if (!attrRule) continue;

      const pairs = attrRule.split(',');
      for (const pair of pairs) {
        const [attrName, key] = pair.split(':').map((s) => s.trim());
        if (attrName && key) {
          el.setAttribute(attrName, this.t(key));
        }
      }
    }

    // Update active state on language buttons
    const langButtons = document.querySelectorAll('[data-lang-btn]');
    for (const btn of langButtons) {
      const targetLang = btn.getAttribute('data-lang-btn');
      if (targetLang === this.currentLanguage) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      }
    }
  }

  /**
   * Registers a subscriber callback for language change events.
   */
  onLanguageChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
    }
    return () => this.listeners.delete(callback);
  }

  /**
   * Notifies all registered subscribers of the language change.
   */
  notifyListeners(lang) {
    for (const cb of this.listeners) {
      try {
        cb(lang);
      } catch (err) {
        console.error('[WikiI18n] Error executing listener:', err);
      }
    }
  }
}

export const wikiI18n = new WikiI18n();
