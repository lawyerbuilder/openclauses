import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { and, eq } from "drizzle-orm";
import pLimit from "p-limit";
import { filers, contracts, clauseTypes, clauses } from "../lib/db/schema";
import {
  searchMaterialContractExhibits,
  buildExhibitUrl,
  fetchExhibitText,
  getFilerInfo,
  type EdgarHit,
} from "./lib/edgar";
import { parseExhibitToClauses, wordCount } from "./lib/parse-clauses";
import { classifyClause } from "./lib/classify";
import { makeLlmClassifier, describeLlmBackend } from "./lib/classify-llm";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const maxFilings = Math.max(1, Number(process.env.EDGAR_MAX_FILINGS ?? 15));
  console.log(`→ Ingesting up to ${maxFilings} EDGAR material-contract exhibits`);

  const sql = neon(url);
  const db = drizzle(sql);

  // Cache clause types so we don't hit the DB per clause.
  const typesList = await db.select().from(clauseTypes);
  const typeBySlug = new Map(typesList.map((t) => [t.slug, t.id]));
  if (typeBySlug.size === 0) {
    throw new Error("No clause types in DB. Run `npm run seed` first to seed the taxonomy.");
  }

  // Optional LLM classifier — used only when GROQ_API_KEY or gateway credentials are present.
  const llmClassify = makeLlmClassifier(Array.from(typeBySlug.keys()));
  console.log(
    llmClassify
      ? `  ✓ LLM classifier enabled (${describeLlmBackend()})`
      : "  · LLM classifier disabled (no GROQ_API_KEY / AI_GATEWAY_API_KEY) — keyword rules only"
  );

  const hits = await searchMaterialContractExhibits({ limit: maxFilings * 2 });
  console.log(`  fetched ${hits.length} candidate exhibits from EDGAR full-text search`);

  // Filter to plausible Exhibit 10.x HTML documents only.
  const candidates = hits
    .filter((h) => h.filename && /\.(htm|html)$/i.test(h.filename))
    .filter((h) => /(ex.*10|10[\.\-_]?\d+)/i.test(h.filename))
    .slice(0, maxFilings);

  console.log(`  ${candidates.length} look like material contract exhibits`);

  const limit = pLimit(2);
  let stats = { contracts: 0, clauses: 0, skipped: 0 };

  await Promise.all(
    candidates.map((hit) =>
      limit(async () => {
        try {
          await ingestOne(hit, db, typeBySlug, llmClassify, stats);
        } catch (err) {
          stats.skipped++;
          console.warn(
            `  ⚠ skipped ${hit.accessionNumber}:${hit.filename} — ${(err as Error).message}`
          );
        }
      })
    )
  );

  console.log(
    `Done. ${stats.contracts} contracts, ${stats.clauses} clauses, ${stats.skipped} skipped.`
  );
}

async function ingestOne(
  hit: EdgarHit,
  db: ReturnType<typeof drizzle>,
  typeBySlug: Map<string, number>,
  llmClassify: ReturnType<typeof makeLlmClassifier>,
  stats: { contracts: number; clauses: number; skipped: number }
) {
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
  if (existing.length > 0) return;

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
    })
    .returning();
  stats.contracts++;

  // Try LLM first (when enabled), fall back to keyword rules. Run in parallel
  // for the contract's clauses — Groq's throughput easily handles this.
  const slugs = await Promise.all(
    parsed.map(async (c) => {
      const llmSlug = llmClassify ? await llmClassify(c.heading, c.text) : null;
      return llmSlug ?? classifyClause(c.heading, c.text);
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

  console.log(`  ✓ ${filerInfo.name} · ${hit.accessionNumber} → ${rows.length} clauses`);
}

function inferExhibitNumber(filename: string): string {
  const m = filename.match(/(?:ex|exhibit)[\-_ ]?(\d+(?:[\.\-_]\d+)?)/i);
  if (m) return m[1].replace(/[\-_]/g, ".");
  const m2 = filename.match(/(\d+\.\d+)/);
  return m2?.[1] ?? "10";
}

function deriveTitle(parsed: Array<{ heading: string; text: string }>, hit: EdgarHit): string {
  // Use the first reasonably-titled heading; fall back to filename.
  const firstHeading = parsed.find((c) => /agreement|contract/i.test(c.heading));
  if (firstHeading) return cleanTitle(firstHeading.heading);
  return `Exhibit ${inferExhibitNumber(hit.filename)} — ${hit.filingType} (${hit.filingDate})`;
}

function cleanTitle(s: string): string {
  return s
    .replace(/[^A-Za-z0-9 ,\-&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
