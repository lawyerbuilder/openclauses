// Bulk EDGAR ingestion: round-robin through ~30 query strategies, paginate
// each, ingest every plausible exhibit. Respects time and contract budgets,
// resumes safely (existing accession_number unique index dedupes), and
// graceful-shuts on Ctrl+C.
//
// Tune via env:
//   INGEST_MAX_MINUTES   default 30 — wall-clock stop
//   INGEST_MAX_CONTRACTS default 200 — stop after this many NEW contracts
//   INGEST_CONCURRENCY   default 3 — concurrent exhibit downloads
//   INGEST_PAGES_PER_QUERY default 5 — how deep to paginate per query
//                          (each page is 100 EDGAR hits)
//
// Examples:
//   npm run ingest:bulk
//   $env:INGEST_MAX_MINUTES=60; $env:INGEST_MAX_CONTRACTS=500; npm run ingest:bulk

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
import { QUERIES } from "./lib/queries";

const MAX_MINUTES = Math.max(1, Number(process.env.INGEST_MAX_MINUTES ?? 30));
const MAX_CONTRACTS = Math.max(1, Number(process.env.INGEST_MAX_CONTRACTS ?? 200));
const CONCURRENCY = Math.max(1, Number(process.env.INGEST_CONCURRENCY ?? 3));
const PAGES_PER_QUERY = Math.max(1, Number(process.env.INGEST_PAGES_PER_QUERY ?? 5));
const PAGE_SIZE = 100; // EDGAR's fixed page size

type Cursor = {
  queryIdx: number;
  page: number; // 0, 1, 2, …
  emptyPagesInARow: number;
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const startedAt = Date.now();
  const deadline = startedAt + MAX_MINUTES * 60_000;

  console.log(
    `→ Bulk ingest: ${QUERIES.length} query strategies × up to ${PAGES_PER_QUERY} pages, ` +
      `budget ${MAX_MINUTES} min / ${MAX_CONTRACTS} new contracts, concurrency ${CONCURRENCY}`
  );

  const sql = neon(url);
  const db = drizzle(sql);

  const typeBySlug = await loadClauseTypeMap(db);
  const llmClassify = makeLlmClassifier(Array.from(typeBySlug.keys()));
  console.log(`  · LLM classifier: ${describeLlmBackend()}`);
  console.log("");

  const stats: IngestStats = { contracts: 0, clauses: 0, skipped: 0, duplicates: 0 };

  // Graceful shutdown — set a flag on SIGINT, finish in-flight work, then exit.
  let stopping = false;
  const onSigint = () => {
    if (stopping) {
      console.log("\n  ⏹  Second Ctrl+C — exiting now.");
      process.exit(130);
    }
    stopping = true;
    console.log("\n  ⏸  Ctrl+C received — finishing in-flight work, then stopping.");
  };
  process.on("SIGINT", onSigint);

  // Round-robin cursor — page through query 0, then query 1, …, then back to
  // query 0 page 1, … This produces breadth before depth.
  const cursors: Cursor[] = QUERIES.map((_, i) => ({
    queryIdx: i,
    page: 0,
    emptyPagesInARow: 0,
  }));

  const exhibitLimit = pLimit(CONCURRENCY);
  let lastReport = startedAt;

  outer: while (cursors.length > 0) {
    if (shouldStop(stats, deadline, stopping)) break;

    // Take the first cursor (FIFO round-robin).
    const cursor = cursors.shift()!;
    const strategy = QUERIES[cursor.queryIdx];

    let hits;
    try {
      hits = await searchMaterialContractExhibits({
        query: strategy.query,
        forms: strategy.forms,
        from: cursor.page * PAGE_SIZE,
      });
    } catch (err) {
      console.warn(`  ⚠ search ${strategy.id} p${cursor.page} failed: ${(err as Error).message}`);
      // Retry this query later by re-enqueueing at the back.
      cursors.push({ ...cursor, page: cursor.page + 1, emptyPagesInARow: cursor.emptyPagesInARow + 1 });
      continue;
    }

    const candidates = hits.filter(isLikelyContract);

    if (candidates.length === 0) {
      cursor.emptyPagesInARow++;
      // Give up on this query after 2 empty pages in a row OR hitting page cap.
      if (cursor.emptyPagesInARow >= 2 || cursor.page + 1 >= PAGES_PER_QUERY) {
        // drop the cursor — done with this query
        continue;
      }
      cursors.push({ ...cursor, page: cursor.page + 1 });
      continue;
    }

    // Process all candidates from this page concurrently.
    const beforeContracts = stats.contracts;
    await Promise.all(
      candidates.map((hit) =>
        exhibitLimit(async () => {
          if (shouldStop(stats, deadline, stopping)) return;
          try {
            const result = await ingestExhibit(
              hit,
              db,
              typeBySlug,
              llmClassify,
              stats,
              strategy.id
            );
            if (result === "new") {
              process.stdout.write(
                `  ✓ [${strategy.id}] ${hit.filerName.slice(0, 32)} · ${hit.filingType} ${hit.filingDate}\n`
              );
            }
          } catch (err) {
            // Per-exhibit failures are routine (cover pages, oddly-formatted docs).
            const msg = (err as Error).message;
            if (!msg.includes("only") || !msg.includes("clauses parsed")) {
              console.warn(
                `  ⚠ [${strategy.id}] ${hit.accessionNumber}:${hit.filename} — ${msg}`
              );
            }
          }
        })
      )
    );

    const gained = stats.contracts - beforeContracts;
    cursor.emptyPagesInARow = gained > 0 ? 0 : cursor.emptyPagesInARow + 1;

    // Re-queue at the BACK for round-robin if we still have budget for more pages.
    if (cursor.page + 1 < PAGES_PER_QUERY && cursor.emptyPagesInARow < 2) {
      cursors.push({ ...cursor, page: cursor.page + 1 });
    }

    // Status line every ~30s.
    const now = Date.now();
    if (now - lastReport > 30_000) {
      printStatus(stats, startedAt, deadline);
      lastReport = now;
    }

    if (shouldStop(stats, deadline, stopping)) break outer;
  }

  process.off("SIGINT", onSigint);
  printStatus(stats, startedAt, deadline);
  console.log("");
  console.log("Done.");
}

function shouldStop(stats: IngestStats, deadline: number, stopping: boolean): boolean {
  if (stopping) return true;
  if (Date.now() >= deadline) return true;
  if (stats.contracts >= MAX_CONTRACTS) return true;
  return false;
}

function printStatus(stats: IngestStats, startedAt: number, deadline: number) {
  const elapsedMin = ((Date.now() - startedAt) / 60_000).toFixed(1);
  const remainMin = Math.max(0, (deadline - Date.now()) / 60_000).toFixed(1);
  console.log(
    `  — t+${elapsedMin}m (${remainMin}m left) · ${stats.contracts} new contracts · ` +
      `${stats.clauses} new clauses · ${stats.duplicates} dup · ${stats.skipped} skipped`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
