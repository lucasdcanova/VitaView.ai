const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");

const applyInlineFormatting = (escapedValue: string): string => {
  let html = escapedValue;

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<u>$1</u>");
  html = html.replace(/(^|[\s(])\*(?!\*)([^*\n]+?)\*(?=$|[\s).,;:!?])/g, "$1<em>$2</em>");
  html = html.replace(/(^|[\s(])_(?!_)([^_\n]+?)_(?=$|[\s).,;:!?])/g, "$1<em>$2</em>");

  return html;
};

export const sanitizeClinicalHtml = (input: string | null | undefined): string => {
  if (!input) return "";

  let html = input
    .replace(/\r\n?/g, "\n")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(\/?)div\b[^>]*>/gi, (_match, closing: string) => (closing ? "</p>" : "<p>"))
    .replace(/<(\/?)b\b[^>]*>/gi, (_match, closing: string) => (closing ? "</strong>" : "<strong>"))
    .replace(/<(\/?)i\b[^>]*>/gi, (_match, closing: string) => (closing ? "</em>" : "<em>"))
    .replace(/<(\/?)span\b[^>]*>/gi, "")
    .replace(/<(\/?)font\b[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "<br>");

  html = html.replace(/<(p|strong|em|u|ul|ol|li)\b[^>]*>/gi, (_match, tag: string) => `<${tag.toLowerCase()}>`);
  html = html.replace(/<\/(p|strong|em|u|ul|ol|li)\b[^>]*>/gi, (_match, tag: string) => `</${tag.toLowerCase()}>`);
  html = html.replace(/<(?!\/?(?:p|br|strong|em|u|ul|ol|li)\b)[^>]+>/gi, "");
  html = html.replace(/<p>\s*<\/p>/gi, "");
  html = html.replace(/(?:<br>\s*){3,}/gi, "<br><br>");

  return html.trim();
};

export const plainTextToClinicalHtml = (input: string | null | undefined): string => {
  if (!input) return "";

  const lines = input.replace(/\r\n?/g, "\n").split("\n");
  const parts: string[] = [];
  let activeList: "ul" | "ol" | null = null;

  const closeList = () => {
    if (!activeList) return;
    parts.push(`</${activeList}>`);
    activeList = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      continue;
    }

    const unordered = line.match(/^[-*•]\s+(.*)$/);
    if (unordered) {
      if (activeList !== "ul") {
        closeList();
        parts.push("<ul>");
        activeList = "ul";
      }
      parts.push(`<li>${applyInlineFormatting(escapeHtml(unordered[1]))}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+[.)]\s+(.*)$/);
    if (ordered) {
      if (activeList !== "ol") {
        closeList();
        parts.push("<ol>");
        activeList = "ol";
      }
      parts.push(`<li>${applyInlineFormatting(escapeHtml(ordered[1]))}</li>`);
      continue;
    }

    closeList();
    parts.push(`<p>${applyInlineFormatting(escapeHtml(line))}</p>`);
  }

  closeList();

  return sanitizeClinicalHtml(parts.join(""));
};

export const normalizeClinicalContent = (input: string | null | undefined): string => {
  if (!input) return "";

  const value = input.trim();
  if (!value) return "";

  return /<\/?[a-z][\s\S]*>/i.test(value)
    ? sanitizeClinicalHtml(value)
    : plainTextToClinicalHtml(value);
};

export const stripClinicalHtml = (input: string | null | undefined): string => {
  const normalized = normalizeClinicalContent(input);
  if (!normalized) return "";

  const plain = normalized
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br>/gi, "\n")
    .replace(/<\/(?:ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  return decodeHtmlEntities(plain)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};
