import { NextRequest, NextResponse } from "next/server";
import { searchClauses, countClauses } from "@/lib/search";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim();
  const type = sp.get("type") ?? undefined;
  const limit = Math.min(50, Math.max(1, Number(sp.get("limit") ?? 20) || 20));
  const offset = Math.max(0, Number(sp.get("offset") ?? 0) || 0);

  if (!q) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const [results, total] = await Promise.all([
    searchClauses({ query: q, typeSlug: type, limit, offset }),
    countClauses({ query: q, typeSlug: type }),
  ]);

  return NextResponse.json({ results, total, query: q, limit, offset });
}
