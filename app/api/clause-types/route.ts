// List of clause types in the OpenClauses taxonomy, with counts. Used by
// ChatGPT Custom GPTs and other OpenAPI consumers to know which `type` slugs
// they can pass to /api/search.

import { NextResponse } from "next/server";
import { listClauseTypes } from "@/lib/search";

export async function GET() {
  const types = await listClauseTypes();
  return NextResponse.json({
    count: types.length,
    types: types.map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      clauseCount: t.clauseCount,
    })),
  });
}
