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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    if (isHeading(line, nextLine)) {
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

// Words that should never end a real heading — they're mid-sentence connectors.
// "23.4 If a" / "23.3 The" used to slip through the numbered-heading regex
// because they happened to start a continuation line.
const TRAILING_NON_HEADING_WORD = /\s+(a|an|the|of|in|on|at|to|for|by|with|from|and|or|but|if|when|while|as|that|which|who|whom|whose|where|why|how|so|nor|yet|both|either|neither|not|no|may|will|shall|should|would|could|must|can|is|are|was|were|be|been|being|have|has|had|do|does|did|its|their|his|her|our|your)$/i;

function isHeading(line: string, nextLine?: string): boolean {
  if (line.length < 4 || line.length > 100) return false;

  // Reject mid-sentence breaks. A real heading does not end with an article,
  // preposition, conjunction, or auxiliary verb.
  if (TRAILING_NON_HEADING_WORD.test(line)) return false;

  // Reject when the next line clearly continues the same sentence (starts
  // lowercase, no leading numbering). "23.4 Termination" followed by "for cause"
  // is not really a heading.
  if (nextLine && /^[a-z]/.test(nextLine)) return false;

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
