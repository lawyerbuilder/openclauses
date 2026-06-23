import * as cheerio from "cheerio";

export type ParsedClause = {
  heading: string;
  text: string;
};

/**
 * Strip EDGAR exhibit HTML down to plain text, then split into clauses by heading.
 * Headings we recognize:
 *   - ALL CAPS lines (often the SEC contract style)
 *   - "Section X.Y Heading"
 *   - "ARTICLE X — HEADING"
 *   - Numbered items like "1. INDEMNIFICATION" or "12.3 Confidentiality"
 *
 * Body text accumulates under the most recent heading until the next heading is seen.
 */
export function parseExhibitToClauses(html: string): ParsedClause[] {
  const $ = cheerio.load(html);
  $("script,style,table").remove();
  const raw = $("body").text() || $.root().text();

  const cleaned = raw
    .replace(/\r/g, "")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n\n")
    .trim();

  const lines = cleaned.split("\n").map((l) => l.trim()).filter(Boolean);

  const clauses: ParsedClause[] = [];
  let current: ParsedClause | null = null;

  for (const line of lines) {
    if (isHeading(line)) {
      if (current && wordCount(current.text) >= 25) clauses.push(current);
      current = { heading: cleanHeading(line), text: "" };
    } else {
      if (!current) {
        // body text before the first heading — skip
        continue;
      }
      current.text += (current.text ? "\n\n" : "") + line;
    }
  }
  if (current && wordCount(current.text) >= 25) clauses.push(current);

  return clauses;
}

const HEADING_PATTERNS = [
  // "Section 1.1 Heading" or "SECTION 1. HEADING"
  /^section\s+\d+(\.\d+)*\s+[A-Z][A-Za-z' \-]{2,80}\.?$/i,
  // "ARTICLE I - HEADING" or "ARTICLE 5: HEADING"
  /^article\s+([ivxlc]+|\d+)\s*[-—:.]\s*[A-Z][A-Za-z' \-]{2,80}\.?$/i,
  // Numbered: "1. INDEMNIFICATION" / "12.3 Confidentiality"
  /^\d+(\.\d+)?\.?\s+[A-Z][A-Za-z' \-]{2,80}\.?$/,
];

function isHeading(line: string): boolean {
  if (line.length < 4 || line.length > 100) return false;
  if (HEADING_PATTERNS.some((re) => re.test(line))) return true;
  // ALL CAPS short line, mostly letters
  const letters = line.replace(/[^A-Za-z]/g, "");
  if (
    letters.length >= 4 &&
    letters === letters.toUpperCase() &&
    line === line.toUpperCase() &&
    !/[.,;:]$/.test(line) &&
    line.split(/\s+/).length <= 10
  ) {
    return true;
  }
  return false;
}

function cleanHeading(line: string): string {
  return line.replace(/\.$/, "").trim();
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
