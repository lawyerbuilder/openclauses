// Shared per-exhibit ingestion logic, called by both
// `npm run ingest:edgar` (single-query, top-of-list) and `npm run ingest:bulk`
// (query rotation + pagination across all strategies).

import { and, eq } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/neon-http";
import { filers, contracts, clauseTypes, clauses } from "../../lib/db/schema";
import { buildExhibitUrl, fetchExhibitText, getFilerInfo, type EdgarHit } from "./edgar";
import { parseExhibitToClauses, wordCount } from "./parse-clauses";
import { classifyClause } from "./classify";
import type { LlmClassifier } from "./classify-llm";

type Db = ReturnType<typeof drizzle>;

export type IngestStats = {
  contracts: number;
  clauses: number;
  skipped: number;
  /** filings already in DB — silently deduped, not counted as work */
  duplicates: number;
};

export async function ingestExhibit(
  hit: EdgarHit,
  db: Db,
  typeBySlug: Map<string, number>,
  llmClassify: LlmClassifier | null,
  stats: IngestStats,
  /** Agreement-type slug — set by the bulk runner from the active query strategy. */
  agreementType?: string
): Promise<"new" | "dup" | "skip"> {
  // Skip if we've already ingested this exhibit.
  const exhibitNumber = inferExhibitNumber(hit.filename);
  const existing = await db
    .select()
    .from(contracts)
    .where(
      and(
        eq(contracts.accessionNumber, hit.accessionNumber),
        eq(contracts.exhibitNumber, exhibitNumber)
      )
    );
  if (existing.length > 0) {
    stats.duplicates++;
    return "dup";
  }

  // Upsert filer.
  const filerInfo = await getFilerInfo(hit.cik);
  let filerRow = (
    await db.select().from(filers).where(eq(filers.cik, filerInfo.cik))
  )[0];
  if (!filerRow) {
    [filerRow] = await db
      .insert(filers)
      .values({
        cik: filerInfo.cik,
        name: filerInfo.name,
        ticker: filerInfo.ticker,
        sicCode: filerInfo.sicCode,
        sicIndustry: filerInfo.sicIndustry,
      })
      .returning();
  }

  const html = await fetchExhibitText(hit);
  const parsed = parseExhibitToClauses(html);
  if (parsed.length < 3) {
    stats.skipped++;
    throw new Error(`only ${parsed.length} clauses parsed — likely not a contract`);
  }

  // Insert contract.
  const [contractRow] = await db
    .insert(contracts)
    .values({
      filerId: filerRow.id,
      accessionNumber: hit.accessionNumber,
      exhibitNumber,
      filingType: hit.filingType,
      filingDate: new Date(hit.filingDate),
      title: deriveTitle(parsed, hit),
      sourceUrl: buildExhibitUrl(hit),
      agreementType,
    })
    .returning();
  stats.contracts++;

  // Classify each clause: keyword first (cheap, handles ~70% of headings),
  // LLM only for the unmatched residue. Keeps Groq calls well under the
  // free-tier 8k TPM cap on gpt-oss-20b for bulk ingestion runs.
  const slugs = await Promise.all(
    parsed.map(async (c) => {
      const keywordSlug = classifyClause(c.heading, c.text);
      if (keywordSlug) return keywordSlug;
      if (!llmClassify) return null;
      return await llmClassify(c.heading, c.text);
    })
  );

  const rows = parsed.map((c, i) => ({
    contractId: contractRow.id,
    clauseTypeId: typeBySlug.get(slugs[i] ?? "") ?? null,
    heading: c.heading,
    text: c.text,
    position: i,
    wordCount: wordCount(c.text),
  }));

  if (rows.length > 0) {
    await db.insert(clauses).values(rows);
    stats.clauses += rows.length;
  }

  return "new";
}

export function inferExhibitNumber(filename: string): string {
  const m = filename.match(/(?:ex|exhibit)[\-_ ]?(\d+(?:[\.\-_]\d+)?)/i);
  if (m) return m[1].replace(/[\-_]/g, ".");
  const m2 = filename.match(/(\d+\.\d+)/);
  return m2?.[1] ?? "10";
}

export function deriveTitle(
  parsed: Array<{ heading: string; text: string }>,
  hit: EdgarHit
): string {
  const firstHeading = parsed.find((c) => /agreement|contract/i.test(c.heading));
  if (firstHeading) return cleanTitle(firstHeading.heading);
  return `Exhibit ${inferExhibitNumber(hit.filename)} — ${hit.filingType} (${hit.filingDate})`;
}

function cleanTitle(s: string): string {
  return s
    // Keep alphanumeric, spaces, commas, hyphens, ampersands, AND periods (for
    // section numbers like "9.4 Contract") and slashes (for "9/4 Contract").
    .replace(/[^A-Za-z0-9 ,\-&./]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/** Filter raw EDGAR hits down to plausible contract exhibits. */
export function isLikelyContract(h: EdgarHit): boolean {
  if (!h.filename) return false;
  if (!/\.(htm|html)$/i.test(h.filename)) return false;
  if (!/(ex.*10|10[\.\-_]?\d+)/i.test(h.filename)) return false;
  return true;
}

/** Load clause type slug → id mapping. Required before running ingestion. */
export async function loadClauseTypeMap(db: Db): Promise<Map<string, number>> {
  const typesList = await db.select().from(clauseTypes);
  const map = new Map(typesList.map((t) => [t.slug, t.id]));
  if (map.size === 0) {
    throw new Error("No clause types in DB. Run `npm run seed` first to seed the taxonomy.");
  }
  return map;
}
