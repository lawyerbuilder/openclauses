import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { FavoritesGrid } from "@/components/favorites-grid";
import {
  listClauseTypes,
  listAgreementTypeCounts,
  getCorpusStats,
} from "@/lib/search";
import { QUERY_BY_SLUG } from "@/scripts/lib/queries";

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
  const [types, agreementCounts, stats] = await Promise.all([
    listClauseTypes().catch(() => []),
    listAgreementTypeCounts().catch(() => []),
    getCorpusStats().catch(() => null),
  ]);

  const topAgreements = agreementCounts.slice(0, 8);

  return (
    <div className="container py-16 sm:py-24">
      <section className="max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground mb-7">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-foreground">SCG Legal</span>
          <span className="text-border">·</span>
          <span>Internal use only</span>
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

        {stats && stats.totalClauses > 0 && (
          <p className="mt-10 text-xs text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">
              {stats.totalClauses.toLocaleString()}
            </span>{" "}
            clauses across{" "}
            <span className="font-semibold text-foreground">
              {stats.totalContracts.toLocaleString()}
            </span>{" "}
            contracts from{" "}
            <span className="font-semibold text-foreground">
              {stats.totalFilers.toLocaleString()}
            </span>{" "}
            filers
          </p>
        )}

        <Link
          href="/connect"
          className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          <span>
            Or use it from{" "}
            <span className="text-foreground font-medium">Claude or ChatGPT</span> directly
          </span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </section>

      {topAgreements.length > 0 && (
        <section className="mt-24">
          <div className="flex items-baseline justify-between mb-7">
            <div>
              <p className="eyebrow mb-1">Agreements</p>
              <h2 className="text-xl font-semibold tracking-tight">Browse by agreement type</h2>
            </div>
            <Link
              href="/agreements"
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              See all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {topAgreements.map((a) => {
              const strategy = QUERY_BY_SLUG.get(a.slug);
              return (
                <Link
                  key={a.slug}
                  href={`/agreements/${a.slug}`}
                  className="surface surface-hover p-4"
                >
                  <div className="font-medium text-[15px] leading-snug">
                    {strategy?.name ?? a.slug}
                  </div>
                  <div className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                    {a.contractCount.toLocaleString()}{" "}
                    {a.contractCount === 1 ? "contract" : "contracts"}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

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

      <FavoritesGrid limit={6} />

      {types.length === 0 && (
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
