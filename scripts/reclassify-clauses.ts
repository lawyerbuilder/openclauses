// Reclassify pass: fill in `clause_type_id` for clauses that came out of bulk
// ingestion unclassified (because the keyword classifier couldn't match the
// heading). Runs Groq sequentially with a delay between calls to stay under
// the free-tier 8k TPM cap.
//
// Safe to run in parallel with `npm run ingest:bulk` — they touch different
// rows (ingest INSERTs, this UPDATEs existing). Resumable: every restart
// picks up where it left off via `WHERE clause_type_id IS NULL`.
//
// Tune via env:
//   RECLASSIFY_MAX_MINUTES   default 60   — wall-clock stop
//   RECLASSIFY_MAX_CLAUSES   default 5000 — stop after N processed
//   RECLASSIFY_DELAY_MS      default 5000 — sleep between Groq calls
//   RECLASSIFY_BATCH_SIZE    default 100  — DB fetch batch size

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import { clauseTypes } from "../lib/db/schema";
import { makeLlmClassifier, describeLlmBackend } from "./lib/classify-llm";

const MAX_MINUTES = Math.max(1, Number(process.env.RECLASSIFY_MAX_MINUTES ?? 60));
const MAX_CLAUSES = Math.max(1, Number(process.env.RECLASSIFY_MAX_CLAUSES ?? 5000));
const DELAY_MS = Math.max(0, Number(process.env.RECLASSIFY_DELAY_MS ?? 5000));
const BATCH_SIZE = Math.max(1, Number(process.env.RECLASSIFY_BATCH_SIZE ?? 100));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const startedAt = Date.now();
  const deadline = startedAt + MAX_MINUTES * 60_000;

  const sqlClient = neon(url);
  const db = drizzle(sqlClient);

  // Load clause types
  const typesList = await db.select().from(clauseTypes);
  const typeBySlug = new Map(typesList.map((t) => [t.slug, t.id]));
  if (typeBySlug.size === 0) {
    throw new Error("No clause types in DB. Run `npm run seed` first.");
  }

  // Initialize LLM
  const llmClassify = makeLlmClassifier(Array.from(typeBySlug.keys()));
  if (!llmClassify) {
    throw new Error(
      "No LLM classifier available. Set GROQ_API_KEY (recommended) or AI_GATEWAY_API_KEY.\n" +
        "From PowerShell: $env:GROQ_API_KEY=\"gsk_...\""
    );
  }

  console.log(`→ Reclassify: backend=${describeLlmBackend()}`);
  console.log(
    `  budget: ${MAX_MINUTES} min / ${MAX_CLAUSES} clauses · ${DELAY_MS}ms between calls`
  );

  // Count remaining work
  const countResult = await db.execute(sql`
    select count(*)::int as count from clauses where clause_type_id is null
  `);
  const totalNull = (countResult.rows[0] as { count: number }).count;
  console.log(`  ${totalNull.toLocaleString()} clauses currently unclassified`);
  console.log("");

  let stopping = false;
  const onSigint = () => {
    if (stopping) {
      console.log("\n  ⏹  Second Ctrl+C — exiting now.");
      process.exit(130);
    }
    stopping = true;
    console.log("\n  ⏸  Ctrl+C received — finishing this call, then stopping.");
  };
  process.on("SIGINT", onSigint);

  let processed = 0;
  let classified = 0;
  let failed = 0;
  let lastReport = Date.now();

  while (!shouldStop()) {
    const batch = await db.execute(sql`
      select id, heading, text
      from clauses
      where clause_type_id is null
      order by id asc
      limit ${BATCH_SIZE}
    `);

    if (batch.rows.length === 0) {
      console.log("  ✓ No more unclassified clauses.");
      break;
    }

    for (const row of batch.rows as Array<{
      id: number;
      heading: string | null;
      text: string;
    }>) {
      if (shouldStop()) break;

      try {
        const slug = await llmClassify(row.heading, row.text);
        if (slug && typeBySlug.has(slug)) {
          await db.execute(sql`
            update clauses set clause_type_id = ${typeBySlug.get(slug)!}
            where id = ${row.id}
          `);
          classified++;
        }
      } catch (err) {
        failed++;
        // Errors from generateObject are already caught inside llmClassify and
        // return null, so anything reaching here is a DB error or unexpected.
        if (failed < 5 || failed % 100 === 0) {
          console.warn(`  ⚠ id=${row.id}: ${(err as Error).message}`);
        }
      }

      processed++;

      // Status every ~30s
      if (Date.now() - lastReport > 30_000) {
        printStatus();
        lastReport = Date.now();
      }

      if (DELAY_MS > 0) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }
  }

  process.off("SIGINT", onSigint);
  printStatus();
  console.log("");
  console.log("Done.");

  function shouldStop(): boolean {
    if (stopping) return true;
    if (Date.now() >= deadline) {
      console.log("  ⏰ Time budget reached.");
      return true;
    }
    if (processed >= MAX_CLAUSES) {
      console.log("  📦 Clause count budget reached.");
      return true;
    }
    return false;
  }

  function printStatus() {
    const elapsedMin = ((Date.now() - startedAt) / 60_000).toFixed(1);
    const remainMin = Math.max(0, (deadline - Date.now()) / 60_000).toFixed(1);
    const rate =
      processed > 0
        ? (processed / ((Date.now() - startedAt) / 60_000)).toFixed(1)
        : "0";
    console.log(
      `  — t+${elapsedMin}m (${remainMin}m left) · ${processed.toLocaleString()} processed · ` +
        `${classified.toLocaleString()} classified · ${failed} failed · ${rate}/min`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
