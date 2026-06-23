import { NextRequest, NextResponse } from "next/server";

// Stub for the Vercel Cron-triggered ingestion endpoint.
//
// The full ingestion logic lives in `scripts/ingest-edgar.ts` and uses cheerio +
// the Drizzle client. To run it from a Function we'd need to lift those modules
// into `lib/` and ensure they're bundled. Left intentionally minimal so the
// cron entry in `vercel.ts` resolves; wire it up when you're ready to run
// ingestion in-platform instead of from your machine.

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  // Vercel attaches an automatic Authorization header on cron requests in
  // production; reject untrusted callers here.
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    note: "Ingestion not yet wired into the Function. Run `npm run ingest:edgar` locally.",
  });
}
