/**
 * Vibrant Castle Wiki — Gothic Markdown Parser & Renderer
 * Zero-dependency parser converting markdown documents to gothic HTML.
 */

export class GothicMarkdownRenderer {
  /**
   * Transforms raw markdown text into safe, semantic gothic HTML.
   */
  render(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return '';
    }

    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const output = [];
    let idx = 0;

    while (idx < lines.length) {
      const line = lines[idx];

      // Code blocks (```lang)
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3).trim();
        const codeLines = [];
        idx++;
        while (idx < lines.length && !lines[idx].trim().startsWith('```')) {
          codeLines.push(this.escapeHtml(lines[idx]));
          idx++;
        }
        idx++; // skip closing ```
        output.push(`<pre><code class="language-${lang || 'text'}">${codeLines.join('\n')}</code></pre>`);
        continue;
      }

      // Markdown tables (| Header 1 | Header 2 |)
      if (this.isTableRow(line) && idx + 1 < lines.length && this.isTableDivider(lines[idx + 1])) {
        const tableHtml = this.parseTable(lines, idx);
        output.push(tableHtml.html);
        idx = tableHtml.nextIdx;
        continue;
      }

      // Horizontal rule (--- or ***)
      if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
        output.push('<hr />');
        idx++;
        continue;
      }

      // Headings (#, ##, ###, ####)
      const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = this.parseInline(headingMatch[2].trim());
        output.push(`<h${level}>${text}</h${level}>`);
        idx++;
        continue;
      }

      // Blockquotes and GitHub-style alerts (> [!NOTE])
      if (line.startsWith('>')) {
        const quoteHtml = this.parseBlockquote(lines, idx);
        output.push(quoteHtml.html);
        idx = quoteHtml.nextIdx;
        continue;
      }

      // Unordered lists (- or *)
      if (/^[-*]\s+/.test(line.trim())) {
        const listHtml = this.parseList(lines, idx, false);
        output.push(listHtml.html);
        idx = listHtml.nextIdx;
        continue;
      }

      // Ordered lists (1. )
      if (/^\d+\.\s+/.test(line.trim())) {
        const listHtml = this.parseList(lines, idx, true);
        output.push(listHtml.html);
        idx = listHtml.nextIdx;
        continue;
      }

      // Empty blank lines
      if (line.trim() === '') {
        idx++;
        continue;
      }

      // Standard paragraph text
      const paraLines = [line];
      idx++;
      while (idx < lines.length && lines[idx].trim() !== '' && !this.isBlockStart(lines[idx])) {
        paraLines.push(lines[idx]);
        idx++;
      }
      const paragraphContent = this.parseInline(paraLines.join(' ').trim());
      output.push(`<p>${paragraphContent}</p>`);
    }

    return output.join('\n');
  }

  isBlockStart(line) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) return true;
    if (trimmed.startsWith('```')) return true;
    if (trimmed.startsWith('>')) return true;
    if (/^[-*]\s+/.test(trimmed)) return true;
    if (/^\d+\.\s+/.test(trimmed)) return true;
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) return true;
    if (this.isTableRow(line)) return true;
    return false;
  }

  isTableRow(line) {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|');
  }

  isTableDivider(line) {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && /^\|[\s-:]+(\|[\s-:]+)+\|$/.test(trimmed);
  }

  parseTable(lines, startIdx) {
    const headerCells = this.extractRowCells(lines[startIdx]);
    let idx = startIdx + 2; // skip header and divider
    const rows = [];

    while (idx < lines.length && this.isTableRow(lines[idx])) {
      rows.push(this.extractRowCells(lines[idx]));
      idx++;
    }

    const thead = `<thead><tr>${headerCells.map((c) => `<th>${this.parseInline(c)}</th>`).join('')}</tr></thead>`;
    const tbodyRows = rows
      .map((r) => `<tr>${r.map((c) => `<td>${this.parseInline(c)}</td>`).join('')}</tr>`)
      .join('');
    const tbody = `<tbody>${tbodyRows}</tbody>`;

    return {
      html: `<table>${thead}${tbody}</table>`,
      nextIdx: idx
    };
  }

  extractRowCells(line) {
    const trimmed = line.trim().slice(1, -1);
    return trimmed.split('|').map((c) => c.trim());
  }

  parseBlockquote(lines, startIdx) {
    const quoteLines = [];
    let idx = startIdx;

    while (idx < lines.length && lines[idx].startsWith('>')) {
      quoteLines.push(lines[idx].replace(/^>\s?/, ''));
      idx++;
    }

    const rawFirstLine = quoteLines[0] || '';
    const alertMatch = rawFirstLine.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);

    // Callout alert box
    if (alertMatch) {
      const alertType = alertMatch[1].toLowerCase();
      const contentLines = quoteLines.slice(1);
      const content = this.parseInline(contentLines.join(' ').trim());
      return {
        html: `<div class="callout-alert ${alertType}"><strong class="alert-type">${alertMatch[1].toUpperCase()}:</strong> ${content}</div>`,
        nextIdx: idx
      };
    }

    const content = this.parseInline(quoteLines.join(' ').trim());
    return {
      html: `<blockquote>${content}</blockquote>`,
      nextIdx: idx
    };
  }

  parseList(lines, startIdx, isOrdered) {
    const items = [];
    const pattern = isOrdered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/;
    let idx = startIdx;

    while (idx < lines.length) {
      const match = lines[idx].trim().match(pattern);
      if (!match) break;
      items.push(this.parseInline(match[1].trim()));
      idx++;
    }

    const tag = isOrdered ? 'ol' : 'ul';
    const listItems = items.map((i) => `<li>${i}</li>`).join('');
    return {
      html: `<${tag}>${listItems}</${tag}>`,
      nextIdx: idx
    };
  }

  parseInline(text) {
    if (!text) return '';

    // Convert raw <kbd>...</kbd> to styled keycaps with class
    let parsed = text.replace(/<kbd>(.*?)<\/kbd>/gi, '<kbd class="kbd-key">$1</kbd>');

    // Inline code: `code`
    parsed = parsed.replace(/`([^`]+)`/g, (match, code) => {
      return `<code>${this.escapeHtml(code)}</code>`;
    });

    // Bold: **text**
    parsed = parsed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic: *text*
    parsed = parsed.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links: [text](url)
    parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      const isExternal = url.startsWith('http') || url.startsWith('//');
      const targetAttr = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${encodeURI(url)}"${targetAttr}>${linkText}</a>`;
    });

    return parsed;
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Fetches remote or local markdown file and injects formatted HTML into target element.
   */
  async fetchAndRender(url, targetElement) {
    if (!targetElement) return;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        targetElement.innerHTML = `<p class="error-msg">Chronicle not found: ${this.escapeHtml(url)} (HTTP ${response.status})</p>`;
        return;
      }
      const markdown = await response.text();
      targetElement.innerHTML = this.render(markdown);
    } catch (err) {
      targetElement.innerHTML = `<p class="error-msg">Failed to load chronicle document: ${this.escapeHtml(String(err))}</p>`;
    }
  }
}

export const gothicMarkdownRenderer = new GothicMarkdownRenderer();
