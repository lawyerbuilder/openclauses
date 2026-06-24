// Single clause detail — used by ChatGPT Custom GPT and any OpenAPI consumer.
// Same data as the MCP `get_clause` tool, in REST shape.

import { NextRequest, NextResponse } from "next/server";
import { getClauseById } from "@/lib/search";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "Invalid clause id" }, { status: 400 });
  }
  const clause = await getClauseById(numericId);
  if (!clause) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: clause.id,
    heading: clause.heading,
    text: clause.text,
    type: clause.clauseTypeName,
    typeSlug: clause.clauseTypeSlug,
    wordCount: clause.wordCount,
    contract: {
      id: clause.contractId,
      title: clause.contractTitle,
      filer: clause.filerName,
      ticker: clause.ticker,
      industry: clause.sicIndustry,
      filingType: clause.filingType,
      filingDate: clause.filingDate,
      counterparty: clause.counterparty,
      governingLaw: clause.governingLaw,
      sourceUrl: clause.sourceUrl,
    },
    detailUrl: `https://scg-openclauses.vercel.app/clauses/${clause.id}`,
  });
}
