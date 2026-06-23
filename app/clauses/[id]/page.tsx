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
    <div className="container py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
        <article>
          <nav className="text-xs text-muted-foreground mb-3 flex flex-wrap items-center gap-1.5">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/clauses" className="hover:text-foreground">Clauses</Link>
            {clause.clauseTypeSlug && clause.clauseTypeName && (
              <>
                <span>/</span>
                <Link
                  href={`/clauses?type=${clause.clauseTypeSlug}`}
                  className="hover:text-foreground"
                >
                  {clause.clauseTypeName}
                </Link>
              </>
            )}
          </nav>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            {clause.heading?.trim() || "Untitled clause"}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{clause.filerName}</span>
            {clause.ticker ? <span>({clause.ticker})</span> : null}
            <span aria-hidden>·</span>
            <span>{clause.filingType}</span>
            <span aria-hidden>·</span>
            <span>{formatDate(clause.filingDate)}</span>
          </div>

          <div className="mt-8 prose prose-slate max-w-none">
            <div className="clause-prose text-[15px] text-foreground/90">{clause.text}</div>
          </div>

          {related.length > 0 && (
            <section className="mt-16">
              <h2 className="text-lg font-semibold mb-4">
                More {clause.clauseTypeName ?? "similar"} clauses
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/clauses/${r.id}`}
                    className="rounded-lg border bg-card p-4 hover:border-foreground/20 transition"
                  >
                    <div className="font-medium text-sm leading-snug">
                      {r.heading?.trim() || "Untitled clause"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{r.filerName}</div>
                    <div className="mt-2 text-xs text-muted-foreground line-clamp-3">
                      {truncate(r.text, 200)}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="space-y-6">
          <section className="rounded-lg border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Source contract
            </h3>
            <Link
              href={clause.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-medium hover:text-primary flex items-start gap-1.5"
            >
              <span>{clause.contractTitle}</span>
              <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            </Link>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Filer</dt>
                <dd className="text-right">{clause.filerName}</dd>
              </div>
              {clause.counterparty ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Counterparty</dt>
                  <dd className="text-right">{clause.counterparty}</dd>
                </div>
              ) : null}
              {clause.governingLaw ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Governing law</dt>
                  <dd className="text-right">{clause.governingLaw}</dd>
                </div>
              ) : null}
              {clause.sicIndustry ? (
                <div className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">Industry</dt>
                  <dd className="text-right">{clause.sicIndustry}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Filing</dt>
                <dd className="text-right">
                  {clause.filingType} · {formatDate(clause.filingDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">Word count</dt>
                <dd className="text-right">{clause.wordCount.toLocaleString()}</dd>
              </div>
            </dl>
          </section>

          {peers.length > 1 && (
            <section className="rounded-lg border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Other clauses in this contract
              </h3>
              <ul className="space-y-1.5 text-sm">
                {peers.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/clauses/${p.id}`}
                      className={
                        p.id === numericId
                          ? "font-medium"
                          : "text-muted-foreground hover:text-foreground"
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
