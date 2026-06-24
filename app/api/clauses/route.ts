// Batch-fetch clauses by ID. Used by the localStorage-based favorites UI to
// load full clause data for the IDs the browser has saved. No auth — clauses
// are public.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

const MAX_IDS = 200;

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, MAX_IDS);

  if (ids.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const result = await db.execute(sql`
    select
      clauses.id,
      clauses.heading,
      substring(clauses.text, 1, 360) as text,
      clauses.word_count as "wordCount",
      contracts.id as "contractId",
      contracts.title as "contractTitle",
      contracts.filing_type as "filingType",
      contracts.filing_date as "filingDate",
      contracts.source_url as "sourceUrl",
      filers.name as "filerName",
      clause_types.slug as "clauseTypeSlug",
      clause_types.name as "clauseTypeName"
    from clauses
    join contracts on contracts.id = clauses.contract_id
    join filers on filers.id = contracts.filer_id
    left join clause_types on clause_types.id = clauses.clause_type_id
    where clauses.id = any(${ids}::int[])
  `);

  // Preserve the order the client asked for.
  const byId = new Map(
    (result.rows as Array<{ id: number }>).map((r) => [r.id, r])
  );
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

  return NextResponse.json({ results: ordered });
}
