// Single-pass EDGAR ingestion: one query, top N filings, exit.
// For sustained breadth across many query types use `npm run ingest:bulk`.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import pLimit from "p-limit";
import { searchMaterialContractExhibits } from "./lib/edgar";
import {
  ingestExhibit,
  isLikelyContract,
  loadClauseTypeMap,
  type IngestStats,
} from "./lib/ingest-one";
import { makeLlmClassifier, describeLlmBackend } from "./lib/classify-llm";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const maxFilings = Math.max(1, Number(process.env.EDGAR_MAX_FILINGS ?? 15));
  console.log(`→ Ingesting up to ${maxFilings} EDGAR material-contract exhibits`);

  const sql = neon(url);
  const db = drizzle(sql);

  const typeBySlug = await loadClauseTypeMap(db);
  const llmClassify = makeLlmClassifier(Array.from(typeBySlug.keys()));
  console.log(`  · LLM classifier: ${describeLlmBackend()}`);

  const hits = await searchMaterialContractExhibits({});
  console.log(`  fetched ${hits.length} candidate exhibits from EDGAR full-text search`);

  const candidates = hits.filter(isLikelyContract).slice(0, maxFilings);
  console.log(`  ${candidates.length} look like material contract exhibits`);

  const limit = pLimit(2);
  const stats: IngestStats = { contracts: 0, clauses: 0, skipped: 0, duplicates: 0 };

  await Promise.all(
    candidates.map((hit) =>
      limit(async () => {
        try {
          const result = await ingestExhibit(hit, db, typeBySlug, llmClassify, stats);
          if (result === "new") {
            console.log(
              `  ✓ ${hit.filerName} · ${hit.accessionNumber}:${hit.filename} → ingested`
            );
          }
        } catch (err) {
          console.warn(
            `  ⚠ skipped ${hit.accessionNumber}:${hit.filename} — ${(err as Error).message}`
          );
        }
      })
    )
  );

  console.log(
    `Done. ${stats.contracts} new contracts, ${stats.clauses} new clauses, ${stats.duplicates} already had, ${stats.skipped} skipped.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
