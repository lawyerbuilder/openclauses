// One-shot backfill: assign agreement_type to existing contracts based on
// keyword matching against their titles. The bulk ingest stores the strategy
// id going forward, but everything ingested before that change has a NULL
// agreement_type — this fills them in.

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql, isNull, eq } from "drizzle-orm";
import { contracts } from "../lib/db/schema";
import { QUERIES } from "./lib/queries";

// Search-phrase → strategy id, ordered most-specific-first so e.g.
// "master services agreement" wins over "services agreement".
const PATTERNS: Array<{ id: string; regex: RegExp }> = QUERIES
  .map((q) => ({
    id: q.id,
    // strip outer quotes and word-boundary anchor
    phrase: q.query.replace(/^"|"$/g, ""),
  }))
  // longer phrases first so specific matches win
  .sort((a, b) => b.phrase.length - a.phrase.length)
  .map(({ id, phrase }) => ({
    id,
    regex: new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i"),
  }));

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function inferAgreementType(title: string): string | null {
  for (const { id, regex } of PATTERNS) {
    if (regex.test(title)) return id;
  }
  return null;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const dbSql = neon(url);
  const db = drizzle(dbSql);

  console.log("→ Loading contracts without agreement_type…");
  const rows = await db
    .select({ id: contracts.id, title: contracts.title })
    .from(contracts)
    .where(isNull(contracts.agreementType));

  console.log(`  ${rows.length} contracts to classify`);
  if (rows.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const counts = new Map<string, number>();
  let unmatched = 0;
  const updates: Array<{ id: number; type: string }> = [];

  for (const row of rows) {
    const type = inferAgreementType(row.title);
    if (type) {
      counts.set(type, (counts.get(type) ?? 0) + 1);
      updates.push({ id: row.id, type });
    } else {
      unmatched++;
    }
  }

  console.log(`  ${updates.length} matched, ${unmatched} unmatched`);

  // Group updates by type and run one UPDATE per type (much faster than per-row).
  const byType = new Map<string, number[]>();
  for (const { id, type } of updates) {
    if (!byType.has(type)) byType.set(type, []);
    byType.get(type)!.push(id);
  }

  console.log("→ Applying updates…");
  for (const [type, ids] of byType) {
    // Process in chunks of 500 to keep query size sane.
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      await db.execute(sql`
        update contracts set agreement_type = ${type}
        where id = any(${chunk}::int[])
      `);
    }
    console.log(`  ✓ ${type}: ${ids.length}`);
  }

  console.log("");
  console.log("Top categories:");
  for (const [type, count] of [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`  ${type.padEnd(20)} ${count}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
