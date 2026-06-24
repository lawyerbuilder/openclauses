import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { QUERY_BY_SLUG } from "@/scripts/lib/queries";
import {
  listContractsByAgreementType,
  countContractsByAgreementType,
  listClauseTypesForAgreementType,
} from "@/lib/search";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

type Props = { params: Promise<{ type: string }>; searchParams: Promise<{ page?: string }> };

const PAGE_SIZE = 30;

export async function generateMetadata({ params }: Props) {
  const { type } = await params;
  const strategy = QUERY_BY_SLUG.get(type);
  if (!strategy) return { title: "Agreement type" };
  return {
    title: strategy.name,
    description: strategy.description,
  };
}

export default async function AgreementTypePage({ params, searchParams }: Props) {
  const { type: slug } = await params;
  const { page: pageParam } = await searchParams;
  const strategy = QUERY_BY_SLUG.get(slug);
  if (!strategy) notFound();

  const page = Math.max(1, Number(pageParam ?? 1) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [contracts, total, clauseTypeCounts] = await Promise.all([
    listContractsByAgreementType({ slug, limit: PAGE_SIZE, offset }),
    countContractsByAgreementType(slug),
    listClauseTypesForAgreementType(slug, 20).catch(() => []),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container py-12 max-w-5xl">
      <nav className="text-xs text-muted-foreground mb-4 flex flex-wrap items-center gap-1.5">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span className="text-border">/</span>
        <Link href="/agreements" className="hover:text-foreground transition-colors">Agreements</Link>
      </nav>

      <header className="mb-10">
        <p className="eyebrow mb-2">{strategy.category}</p>
        <h1 className="text-[2.25rem] font-semibold tracking-tight leading-tight">
          {strategy.name}
        </h1>
        {strategy.description && (
          <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
            {strategy.description}
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">{total.toLocaleString()}</span>{" "}
          {total === 1 ? "contract" : "contracts"} indexed
        </p>
      </header>

      {clauseTypeCounts.length > 0 && (
        <section className="mb-10">
          <p className="eyebrow mb-3">Jump to clauses of type</p>
          <div className="flex flex-wrap gap-2">
            {clauseTypeCounts.map((c) => (
              <Link
                key={c.slug}
                href={`/clauses?type=${c.slug}&agreement=${slug}`}
                className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:border-foreground/20 hover:text-foreground transition"
              >
                {c.name}{" "}
                <span className="tabular-nums opacity-70">
                  ({c.clauseCount.toLocaleString()})
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {contracts.length === 0 ? (
        <div className="surface p-6 text-sm text-muted-foreground">
          No contracts of this type have been ingested yet. Re-run{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5">npm run ingest:bulk</code> to pull
          more.
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <Link
              key={c.id}
              href={`/contracts/${c.id}`}
              className="surface surface-hover p-5 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-semibold text-[15px] tracking-tight">
                    {c.filerName}
                  </span>
                  {c.ticker && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      ({c.ticker})
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                  {c.title}
                </p>
                <div className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                  <span className="tabular-nums">{c.filingType}</span>
                  <span className="text-border">·</span>
                  <span className="tabular-nums">{formatDate(c.filingDate)}</span>
                  {c.sicIndustry && (
                    <>
                      <span className="text-border">·</span>
                      <span className="truncate">{c.sicIndustry}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-semibold tabular-nums leading-none">
                  {c.clauseCount}
                </div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide mt-1">
                  {c.clauseCount === 1 ? "clause" : "clauses"}
                </div>
              </div>
            </Link>
          ))}

          {totalPages > 1 && (
            <nav className="flex items-center justify-between pt-6">
              {page > 1 ? (
                <Link
                  className="text-sm font-medium text-primary hover:underline"
                  href={`/agreements/${slug}?page=${page - 1}`}
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-muted-foreground tabular-nums">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  className="text-sm font-medium text-primary hover:underline"
                  href={`/agreements/${slug}?page=${page + 1}`}
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
