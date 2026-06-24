import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getClauseById, getRelatedClauses } from "@/lib/search";
import { formatDate, truncate } from "@/lib/utils";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const revalidate = 600;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const clause = await getClauseById(Number(id)).catch(() => null);
  if (!clause) return { title: "Clause not found" };
  const heading = clause.heading?.trim() || "Clause";
  return {
    title: `${heading} — ${clause.filerName}`,
    description: truncate(clause.text, 160),
  };
}

export default async function ClauseDetailPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const clause = await getClauseById(numericId);
  if (!clause) notFound();

  const related = await getRelatedClauses(clause.clauseTypeId, numericId, 6).catch(() => []);

  const peerResult = await db.execute(sql`
    select id, heading, position
    from clauses
    where contract_id = ${clause.contractId}
    order by position asc
    limit 50
  `);
  const peers = peerResult.rows as Array<{ id: number; heading: string | null; position: number }>;

  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
        <article>
          <nav className="text-xs text-muted-foreground mb-4 flex flex-wrap items-center gap-1.5">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="text-border">/</span>
            <Link href="/clauses" className="hover:text-foreground transition-colors">Clauses</Link>
            {clause.clauseTypeSlug && clause.clauseTypeName && (
              <>
                <span className="text-border">/</span>
                <Link
                  href={`/clauses?type=${clause.clauseTypeSlug}`}
                  className="hover:text-foreground transition-colors"
                >
                  {clause.clauseTypeName}
                </Link>
              </>
            )}
          </nav>

          {clause.clauseTypeName && (
            <p className="eyebrow mb-2">{clause.clauseTypeName}</p>
          )}
          <h1 className="text-[1.75rem] sm:text-[2.125rem] font-semibold tracking-tight leading-tight">
            {clause.heading?.trim() || "Untitled clause"}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{clause.filerName}</span>
            {clause.ticker ? (
              <span className="text-xs tabular-nums">({clause.ticker})</span>
            ) : null}
            <span className="text-border">·</span>
            <span>{clause.filingType}</span>
            <span className="text-border">·</span>
            <span className="tabular-nums">{formatDate(clause.filingDate)}</span>
          </div>

          <div className="mt-10 surface p-7 sm:p-9">
            <div className="clause-prose text-foreground/90">{clause.text}</div>
          </div>

          {related.length > 0 && (
            <section className="mt-16">
              <div className="mb-5">
                <p className="eyebrow mb-1">Compare</p>
                <h2 className="text-lg font-semibold tracking-tight">
                  More {clause.clauseTypeName ?? "similar"} clauses
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/clauses/${r.id}`}
                    className="surface surface-hover p-4"
                  >
                    <div className="font-semibold text-sm leading-snug tracking-tight">
                      {r.heading?.trim() || "Untitled clause"}
                    </div>
                    <div className="mt-1.5 text-xs text-muted-foreground">{r.filerName}</div>
                    <div className="mt-2.5 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {truncate(r.text, 200)}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="space-y-5">
          <section className="surface p-5">
            <p className="eyebrow mb-3">Source contract</p>
            <Link
              href={clause.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-semibold leading-snug tracking-tight hover:text-primary transition-colors flex items-start gap-1.5"
            >
              <span>{clause.contractTitle}</span>
              <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            </Link>
            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Filer</dt>
                <dd className="text-right font-medium">{clause.filerName}</dd>
              </div>
              {clause.counterparty ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Counterparty</dt>
                  <dd className="text-right font-medium">{clause.counterparty}</dd>
                </div>
              ) : null}
              {clause.governingLaw ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Governing law</dt>
                  <dd className="text-right font-medium">{clause.governingLaw}</dd>
                </div>
              ) : null}
              {clause.sicIndustry ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Industry</dt>
                  <dd className="text-right font-medium">{clause.sicIndustry}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Filing</dt>
                <dd className="text-right font-medium tabular-nums">
                  {clause.filingType} · {formatDate(clause.filingDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Word count</dt>
                <dd className="text-right font-medium tabular-nums">
                  {clause.wordCount.toLocaleString()}
                </dd>
              </div>
            </dl>
          </section>

          {peers.length > 1 && (
            <section className="surface p-5">
              <p className="eyebrow mb-3">Other clauses in this contract</p>
              <ul className="space-y-2 text-sm">
                {peers.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/clauses/${p.id}`}
                      className={
                        p.id === numericId
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground hover:text-foreground transition-colors"
                      }
                    >
                      {p.heading?.trim() || `Section ${p.position}`}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
