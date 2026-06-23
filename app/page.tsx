import Link from "next/link";
import { Suspense } from "react";
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

  return (
    <div className="container py-12 sm:py-16">
      <section className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-balance">
          A free, open clause library.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-balance">
          Search and compare contract clauses extracted from public SEC EDGAR filings — the same
          source the paid services use, without the paywall.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-14 rounded-lg border bg-card" />}>
            <SearchBar />
          </Suspense>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
          {POPULAR_QUERIES.map((q) => (
            <Link
              key={q}
              href={`/search?q=${encodeURIComponent(q)}`}
              className="rounded-full border bg-card px-3 py-1 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition"
            >
              {q}
            </Link>
          ))}
        </div>
      </section>

      {types.length > 0 && (
        <section className="mt-20">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xl font-semibold">Browse by clause type</h2>
            <Link href="/clauses" className="text-sm text-primary hover:underline">
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {types.slice(0, 12).map((t) => (
              <Link
                key={t.id}
                href={`/clauses?type=${t.slug}`}
                className="rounded-lg border bg-card p-4 hover:border-foreground/20 transition"
              >
                <div className="font-medium">{t.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t.clauseCount.toLocaleString()} clauses
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mt-20">
          <h2 className="text-xl font-semibold mb-6">Recently added</h2>
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
        <section className="mt-16 mx-auto max-w-2xl rounded-lg border bg-card p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">No clauses yet.</p>
          <p>
            The database hasn&apos;t been seeded. Run{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5">npm run db:push</code> then{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5">npm run seed</code> to load demo
            content, or <code className="rounded bg-secondary px-1.5 py-0.5">npm run ingest:edgar</code> to pull live
            contracts from SEC EDGAR.
          </p>
        </section>
      )}
    </div>
  );
}
