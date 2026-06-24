import Link from "next/link";
import { Suspense } from "react";
import { SearchBar } from "@/components/search-bar";
import { ClauseCard } from "@/components/clause-card";
import { searchClauses, countClauses, listClauseTypes } from "@/lib/search";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
};

const PAGE_SIZE = 20;

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const typeSlug = params.type;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [results, total, types] = await Promise.all([
    q ? searchClauses({ query: q, typeSlug, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }) : Promise.resolve([]),
    q ? countClauses({ query: q, typeSlug }) : Promise.resolve(0),
    listClauseTypes().catch(() => []),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container py-8">
      <div className="max-w-2xl">
        <Suspense fallback={<div className="h-14 rounded-lg border bg-card" />}>
          <SearchBar />
        </Suspense>
      </div>

      {q ? (
        <div className="mt-6 text-sm text-muted-foreground">
          {total.toLocaleString()} {total === 1 ? "result" : "results"} for{" "}
          <span className="font-medium text-foreground">&ldquo;{q}&rdquo;</span>
          {typeSlug && (
            <>
              {" "}in{" "}
              <Link href={`/search?q=${encodeURIComponent(q)}`} className="text-primary hover:underline">
                {types.find((t) => t.slug === typeSlug)?.name ?? typeSlug}
              </Link>
            </>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Enter a query above to search clauses.</p>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
        <div className="space-y-4">
          {results.map((c) => (
            <ClauseCard
              key={c.id}
              id={c.id}
              heading={c.heading}
              text={c.text}
              filerName={c.filerName}
              contractTitle={c.contractTitle}
              clauseTypeName={c.clauseTypeName}
              clauseTypeSlug={c.clauseTypeSlug}
              highlightedHtml
            />
          ))}
          {q && results.length === 0 && (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              No matches. Try a broader query or remove the type filter.
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-between pt-4">
              {page > 1 ? (
                <Link
                  className="text-sm text-primary hover:underline"
                  href={buildPageUrl({ q, type: typeSlug, page: page - 1 })}
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
                  href={buildPageUrl({ q, type: typeSlug, page: page + 1 })}
                >
                  Next →
                </Link>
              ) : <span />}
            </nav>
          )}
        </div>

        {types.length > 0 && (
          <aside className="space-y-3 sticky top-24">
            <p className="eyebrow">Filter by type</p>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link
                  href={q ? `/search?q=${encodeURIComponent(q)}` : "/search"}
                  className={
                    !typeSlug
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground transition-colors"
                  }
                >
                  All types
                </Link>
              </li>
              {types.slice(0, 20).map((t) => (
                <li key={t.id}>
                  <Link
                    href={
                      q
                        ? `/search?q=${encodeURIComponent(q)}&type=${t.slug}`
                        : `/clauses?type=${t.slug}`
                    }
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
        )}
      </div>
    </div>
  );
}

function buildPageUrl({ q, type, page }: { q: string; type?: string; page: number }) {
  const sp = new URLSearchParams({ q });
  if (type) sp.set("type", type);
  if (page > 1) sp.set("page", String(page));
  return `/search?${sp.toString()}`;
}
