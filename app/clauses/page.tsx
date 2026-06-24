import Link from "next/link";
import { ClauseCard } from "@/components/clause-card";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { listClauseTypes } from "@/lib/search";

export const revalidate = 300;

type Props = {
  searchParams: Promise<{ type?: string; page?: string }>;
};

const PAGE_SIZE = 20;

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const typeSlug = params.type;
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const types = await listClauseTypes().catch(() => []);
  const active = typeSlug ? types.find((t) => t.slug === typeSlug) : undefined;

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
    ${typeSlug ? sql`where clause_types.slug = ${typeSlug}` : sql``}
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

  const total = typeSlug
    ? active?.clauseCount ?? 0
    : types.reduce((sum, t) => sum + t.clauseCount, 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {active ? active.name : "Browse clauses"}
        </h1>
        {active?.description && <p className="mt-2 text-muted-foreground">{active.description}</p>}
        {!active && (
          <p className="mt-2 text-muted-foreground">All clauses, newest first.</p>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
        <div className="space-y-4">
          {rows.map((c) => (
            <ClauseCard key={c.id} {...c} />
          ))}
          {rows.length === 0 && (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              No clauses found.
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-between pt-4">
              {page > 1 ? (
                <Link
                  className="text-sm text-primary hover:underline"
                  href={`/clauses?${new URLSearchParams({ ...(typeSlug ? { type: typeSlug } : {}), page: String(page - 1) }).toString()}`}
                >
                  ← Previous
                </Link>
              ) : <span />}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  className="text-sm text-primary hover:underline"
                  href={`/clauses?${new URLSearchParams({ ...(typeSlug ? { type: typeSlug } : {}), page: String(page + 1) }).toString()}`}
                >
                  Next →
                </Link>
              ) : <span />}
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
                    typeSlug === t.slug ? "font-medium" : "text-muted-foreground hover:text-foreground"
                  }
                >
                  {t.name}{" "}
                  <span className="text-xs">({t.clauseCount.toLocaleString()})</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
