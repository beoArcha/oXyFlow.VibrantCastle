/**
 * Zero-dependency Markdown renderer for the Vibrant Castle wiki shell.
 * Shipped as browser JavaScript (embedded into wiki-app.js by wikiAppScript.ts).
 *
 * Supported: ATX headings (# to ####), paragraphs, nested ordered and unordered
 * lists, blockquotes (recursive), fenced code blocks, pipe tables, horizontal
 * rules, inline code, bold, italic, links (http(s), relative, and #anchors only)
 * and a small allowlist of inline HTML tags (kbd, br, strong, em, code, sub, sup, span).
 * Every other character is escaped, so article text can never inject markup.
 *
 * Written as String.raw: backticks are spelled \x60 and no template interpolation is used.
 */
export const WIKI_MARKDOWN_JS = String.raw`
function mdEscape(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mdInline(raw) {
  var parts = String(raw).split(/(\x60[^\x60]+\x60)/);
  var out = "";
  for (var i = 0; i < parts.length; i += 1) {
    var part = parts[i];
    if (i % 2 === 1) {
      out += "<code>" + mdEscape(part.slice(1, -1)) + "</code>";
      continue;
    }
    var text = mdEscape(part);
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_m, label, url) {
      if (!/^(https?:\/\/|\.\.?\/|#|[A-Za-z0-9_.\/-]+$)/.test(url)) return label;
      var external = /^https?:\/\//.test(url);
      var extra = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return '<a href="' + url + '"' + extra + ">" + label + "</a>";
    });
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*([^*\s][^*]*)\*/g, "<em>$1</em>");
    text = text.replace(/&lt;(\/?)(kbd|br|strong|em|code|sub|sup|span)\s*(\/?)&gt;/gi, function (_m, close, tag) {
      if (tag.toLowerCase() === "br") return "<br />";
      return "<" + close + tag.toLowerCase() + ">";
    });
    out += text;
  }
  return out;
}

function mdIsFence(line) {
  return /^\s*\x60\x60\x60/.test(line);
}

function mdIsHr(line) {
  return /^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(line);
}

function mdIsQuote(line) {
  return /^\s*>/.test(line);
}

function mdListMarker(line) {
  return /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line);
}

function mdIsTableRow(line) {
  var t = line.trim();
  return t.length > 1 && t.charAt(0) === "|" && t.charAt(t.length - 1) === "|";
}

function mdIsTableDivider(line) {
  return /^\s*\|(\s*:?-{2,}:?\s*\|)+\s*$/.test(line);
}

function mdSplitRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map(function (cell) { return cell.trim(); });
}

function mdBlockStart(line) {
  return (
    mdIsFence(line) ||
    /^#{1,4}\s+/.test(line.trim()) ||
    mdIsQuote(line) ||
    mdIsHr(line) ||
    Boolean(mdListMarker(line)) ||
    mdIsTableRow(line)
  );
}

function mdDedent(body) {
  var rest = body.slice(1);
  var cut = null;
  rest.forEach(function (l) {
    if (l.trim() === "") return;
    var n = l.search(/\S/);
    if (cut === null || n < cut) cut = n;
  });
  var amount = cut || 0;
  return [body[0]].concat(rest.map(function (l) {
    return l.trim() === "" ? "" : l.slice(amount);
  }));
}

function renderMarkdown(source) {
  var lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
  var out = [];
  var i = 0;

  while (i < lines.length) {
    var line = lines[i];
    var trimmed = line.trim();

    if (trimmed === "") {
      i += 1;
      continue;
    }

    if (mdIsFence(line)) {
      var lang = trimmed.replace(/^\x60+/, "").trim() || "text";
      var code = [];
      i += 1;
      while (i < lines.length && !mdIsFence(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push('<pre><code class="language-' + mdEscape(lang) + '">' + mdEscape(code.join("\n")) + "</code></pre>");
      continue;
    }

    if (mdIsHr(line)) {
      out.push("<hr />");
      i += 1;
      continue;
    }

    var heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      var level = heading[1].length;
      out.push("<h" + level + ">" + mdInline(heading[2].trim()) + "</h" + level + ">");
      i += 1;
      continue;
    }

    if (mdIsQuote(line)) {
      var quoted = [];
      while (i < lines.length && mdIsQuote(lines[i])) {
        quoted.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      out.push("<blockquote>" + renderMarkdown(quoted.join("\n")) + "</blockquote>");
      continue;
    }

    if (mdIsTableRow(line) && i + 1 < lines.length && mdIsTableDivider(lines[i + 1])) {
      var head = mdSplitRow(line);
      var rows = [];
      i += 2;
      while (i < lines.length && mdIsTableRow(lines[i])) {
        rows.push(mdSplitRow(lines[i]));
        i += 1;
      }
      var table = '<div class="table-wrap"><table><thead><tr>';
      table += head.map(function (c) { return "<th>" + mdInline(c) + "</th>"; }).join("");
      table += "</tr></thead><tbody>";
      table += rows.map(function (r) {
        return "<tr>" + r.map(function (c) { return "<td>" + mdInline(c) + "</td>"; }).join("") + "</tr>";
      }).join("");
      table += "</tbody></table></div>";
      out.push(table);
      continue;
    }

    var first = mdListMarker(line);
    if (first) {
      var ordered = /\d+\./.test(first[2]);
      var baseIndent = first[1].length;
      var items = [];
      while (i < lines.length) {
        var m = mdListMarker(lines[i]);
        if (!m || m[1].length !== baseIndent || /\d+\./.test(m[2]) !== ordered) break;
        var body = [m[3]];
        i += 1;
        while (i < lines.length) {
          var next = lines[i];
          if (next.trim() === "") {
            var look = i + 1;
            while (look < lines.length && lines[look].trim() === "") look += 1;
            if (look < lines.length && lines[look].search(/\S/) > baseIndent) {
              body.push("");
              i += 1;
              continue;
            }
            break;
          }
          if (next.search(/\S/) > baseIndent) {
            body.push(next);
            i += 1;
            continue;
          }
          break;
        }
        items.push(body);
      }
      var tag = ordered ? "ol" : "ul";
      out.push("<" + tag + ">" + items.map(function (itemBody) {
        var content = itemBody.length === 1
          ? mdInline(itemBody[0])
          : renderMarkdown(mdDedent(itemBody).join("\n"));
        return "<li>" + content + "</li>";
      }).join("") + "</" + tag + ">");
      continue;
    }

    var para = [trimmed];
    i += 1;
    while (i < lines.length && lines[i].trim() !== "" && !mdBlockStart(lines[i])) {
      para.push(lines[i].trim());
      i += 1;
    }
    out.push("<p>" + mdInline(para.join(" ")) + "</p>");
  }

  return out.join("\n");
}
`;
