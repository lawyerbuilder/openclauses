// List of agreement types in the OpenClauses taxonomy, with per-type contract
// and clause counts. Used by ChatGPT Custom GPTs and other OpenAPI consumers.

import { NextResponse } from "next/server";
import { listAgreementTypeCounts } from "@/lib/search";
import { QUERY_BY_SLUG } from "@/scripts/lib/queries";

export async function GET() {
  const counts = await listAgreementTypeCounts();
  return NextResponse.json({
    count: counts.length,
    agreements: counts.map((c) => {
      const strategy = QUERY_BY_SLUG.get(c.slug);
      return {
        slug: c.slug,
        name: strategy?.name ?? c.slug,
        description: strategy?.description ?? null,
        category: strategy?.category ?? null,
        contractCount: c.contractCount,
        clauseCount: c.clauseCount,
      };
    }),
  });
}
