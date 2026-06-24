import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { ClauseCard } from "@/components/clause-card";
import { listClauseTypes, listRecentClauses } from "@/lib/search";

export const revalidate = 300;

const POPULAR_QUERIES = [
  "indemnification",
  "force majeure",
  "non-compete",
  "limitation of liability",
  "termination for convenience",
  "governing law",
  "confidentiality",
  "intellectual property",
];

export default async function HomePage() {
  const [types, recent] = await Promise.all([
    listClauseTypes().catch(() => []),
    listRecentClauses(6).catch(() => []),
  ]);

  const totalClauses = types.reduce((sum, t) => sum + t.clauseCount, 0);

  return (
    <div className="container py-16 sm:py-24">
      <section className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground mb-7">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-foreground">SCG Legal</span>
          <span className="text-border">·</span>
          <span>Open-source clause library</span>
        </div>

        <h1 className="text-[2.5rem] sm:text-[3.25rem] font-semibold tracking-tight leading-[1.05] text-balance">
          A clause library for the lawyers at SCG.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
          Search and compare contract clauses extracted from public SEC EDGAR filings —
          the same source the paid services use, without the paywall.
        </p>

        <div className="mt-10">
          <Suspense fallback={<div className="h-14 rounded-md border bg-card" />}>
            <SearchBar />
          </Suspense>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
          {POPULAR_QUERIES.map((q) => (
            <Link
              key={q}
              href={`/search?q=${encodeURIComponent(q)}`}
              className="rounded-full border border-border/70 bg-card px-3 py-1 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition"
            >
              {q}
            </Link>
          ))}
        </div>

        {totalClauses > 0 && (
          <p className="mt-10 text-xs text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{totalClauses.toLocaleString()}</span>{" "}
            clauses indexed across{" "}
            <span className="font-semibold text-foreground">{types.length}</span> clause types
          </p>
        )}
      </section>

      {types.length > 0 && (
        <section className="mt-24">
          <div className="flex items-baseline justify-between mb-7">
            <div>
              <p className="eyebrow mb-1">Taxonomy</p>
              <h2 className="text-xl font-semibold tracking-tight">Browse by clause type</h2>
            </div>
            <Link
              href="/clauses"
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              See all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {types.slice(0, 12).map((t) => (
              <Link
                key={t.id}
                href={`/clauses?type=${t.slug}`}
                className="surface surface-hover p-4"
              >
                <div className="font-medium text-[15px] leading-snug">{t.name}</div>
                <div className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                  {t.clauseCount.toLocaleString()} {t.clauseCount === 1 ? "clause" : "clauses"}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mt-24">
          <div className="mb-7">
            <p className="eyebrow mb-1">Latest additions</p>
            <h2 className="text-xl font-semibold tracking-tight">Recently ingested</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {recent.map((c) => (
              <ClauseCard
                key={c.id}
                id={c.id}
                heading={c.heading}
                text={c.text}
                filerName={c.filerName}
                contractTitle={c.contractTitle}
                clauseTypeName={c.clauseTypeName}
                clauseTypeSlug={c.clauseTypeSlug}
              />
            ))}
          </div>
        </section>
      )}

      {types.length === 0 && recent.length === 0 && (
        <section className="mt-16 mx-auto max-w-2xl surface p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">No clauses yet.</p>
          <p>
            The database hasn&apos;t been seeded. Run{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5">npm run seed</code> to load demo
            content, or <code className="rounded bg-secondary px-1.5 py-0.5">npm run ingest:bulk</code>{" "}
            to pull live contracts from SEC EDGAR.
          </p>
        </section>
      )}
    </div>
  );
}
