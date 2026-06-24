import Link from "next/link";
import { ClauseCard } from "@/components/clause-card";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { listClauseTypes, listAgreementsForClauseType } from "@/lib/search";
import { QUERY_BY_SLUG } from "@/scripts/lib/queries";

export const revalidate = 300;

type Props = {
  searchParams: Promise<{ type?: string; agreement?: string; page?: string }>;
};

const PAGE_SIZE = 20;

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const typeSlug = params.type;
  const agreementSlug = params.agreement;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const types = await listClauseTypes().catch(() => []);
  const active = typeSlug ? types.find((t) => t.slug === typeSlug) : undefined;
  const activeAgreement = agreementSlug ? QUERY_BY_SLUG.get(agreementSlug) : undefined;

  // Only fetch agreement filter pills when a clause type is selected.
  const agreementCounts = typeSlug
    ? await listAgreementsForClauseType(typeSlug, 20).catch(() => [])
    : [];

  // Build the WHERE clause dynamically based on which filters are active.
  const whereSql =
    typeSlug && agreementSlug
      ? sql`where clause_types.slug = ${typeSlug} and contracts.agreement_type = ${agreementSlug}`
      : typeSlug
        ? sql`where clause_types.slug = ${typeSlug}`
        : agreementSlug
          ? sql`where contracts.agreement_type = ${agreementSlug}`
          : sql``;

  const result = await db.execute(sql`
    select
      clauses.id,
      clauses.heading,
      substring(clauses.text, 1, 360) as text,
      filers.name as "filerName",
      contracts.title as "contractTitle",
      clause_types.slug as "clauseTypeSlug",
      clause_types.name as "clauseTypeName"
    from clauses
    join contracts on contracts.id = clauses.contract_id
    join filers on filers.id = contracts.filer_id
    left join clause_types on clause_types.id = clauses.clause_type_id
    ${whereSql}
    order by clauses.id desc
    limit ${PAGE_SIZE} offset ${offset}
  `);

  const rows = result.rows as Array<{
    id: number;
    heading: string | null;
    text: string;
    filerName: string;
    contractTitle: string;
    clauseTypeSlug: string | null;
    clauseTypeName: string | null;
  }>;

  // Total count: if both filters active, sum the relevant agreement; if only
  // type filter, use cached count from active; otherwise count() across all.
  let total: number;
  if (typeSlug && agreementSlug) {
    const row = agreementCounts.find((a) => a.slug === agreementSlug);
    total = row?.clauseCount ?? 0;
  } else if (typeSlug) {
    total = active?.clauseCount ?? 0;
  } else if (agreementSlug) {
    const countResult = await db.execute(sql`
      select count(*)::int as count
      from clauses
      join contracts on contracts.id = clauses.contract_id
      where contracts.agreement_type = ${agreementSlug}
    `);
    total = (countResult.rows[0] as { count: number }).count;
  } else {
    total = types.reduce((sum, t) => sum + t.clauseCount, 0);
  }
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildUrl(opts: { type?: string | null; agreement?: string | null; page?: number }) {
    const sp = new URLSearchParams();
    const t = opts.type === undefined ? typeSlug : opts.type;
    const a = opts.agreement === undefined ? agreementSlug : opts.agreement;
    if (t) sp.set("type", t);
    if (a) sp.set("agreement", a);
    if (opts.page && opts.page > 1) sp.set("page", String(opts.page));
    const qs = sp.toString();
    return qs ? `/clauses?${qs}` : "/clauses";
  }

  return (
    <div className="container py-12">
      <header className="mb-8">
        <h1 className="text-[2rem] font-semibold tracking-tight leading-tight">
          {active ? active.name : "Browse clauses"}
        </h1>
        {active?.description && (
          <p className="mt-2 text-muted-foreground leading-relaxed">{active.description}</p>
        )}
        {!active && (
          <p className="mt-2 text-muted-foreground">All clauses, newest first.</p>
        )}
        {activeAgreement && (
          <p className="mt-3 text-sm text-muted-foreground">
            Filtered to{" "}
            <span className="font-semibold text-foreground">{activeAgreement.name}</span>s ·{" "}
            <Link
              href={buildUrl({ agreement: null, page: 1 })}
              className="text-primary hover:underline"
            >
              clear
            </Link>
          </p>
        )}
      </header>

      {/* Agreement-type filter pills — only shown when a clause type is active */}
      {typeSlug && agreementCounts.length > 0 && (
        <section className="mb-8">
          <p className="eyebrow mb-3">Filter by agreement type</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildUrl({ agreement: null, page: 1 })}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                !agreementSlug
                  ? "border-foreground/30 bg-foreground text-background"
                  : "border-border/70 bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              }`}
            >
              All {(active?.clauseCount ?? 0).toLocaleString()}
            </Link>
            {agreementCounts.map((a) => {
              const strategy = QUERY_BY_SLUG.get(a.slug);
              const isActive = agreementSlug === a.slug;
              return (
                <Link
                  key={a.slug}
                  href={buildUrl({ agreement: a.slug, page: 1 })}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    isActive
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/70 bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  {strategy?.name ?? a.slug}{" "}
                  <span className="tabular-nums opacity-70">
                    ({a.clauseCount.toLocaleString()})
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
        <div className="space-y-4">
          {rows.map((c) => (
            <ClauseCard key={c.id} {...c} />
          ))}
          {rows.length === 0 && (
            <div className="surface p-6 text-sm text-muted-foreground">
              No clauses found with the current filters.
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-between pt-4">
              {page > 1 ? (
                <Link
                  className="text-sm font-medium text-primary hover:underline"
                  href={buildUrl({ page: page - 1 })}
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
                  href={buildUrl({ page: page + 1 })}
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>

        <aside className="space-y-3 sticky top-24">
          <p className="eyebrow">Clause types</p>
          <ul className="space-y-1.5 text-sm">
            <li>
              <Link
                href="/clauses"
                className={
                  !typeSlug
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                All
              </Link>
            </li>
            {types.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/clauses?type=${t.slug}`}
                  className={
                    typeSlug === t.slug
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground transition-colors"
                  }
                >
                  {t.name}{" "}
                  <span className="text-xs tabular-nums opacity-70">
                    ({t.clauseCount.toLocaleString()})
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
