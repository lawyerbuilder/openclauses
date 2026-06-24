"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { ClauseCard } from "./clause-card";
import { useFavorites } from "@/hooks/use-favorites";

type ClauseRow = {
  id: number;
  heading: string | null;
  text: string;
  filerName: string;
  contractTitle: string;
  clauseTypeSlug: string | null;
  clauseTypeName: string | null;
};

type Props = {
  /** When set, only render up to this many cards. */
  limit?: number;
  /** Show "See all" link if there are more than `limit`. Defaults to true on homepage. */
  showSeeAll?: boolean;
  /** Use a section header? Disable when used as the main content of /favorites. */
  withSectionHeader?: boolean;
};

export function FavoritesGrid({
  limit,
  showSeeAll = true,
  withSectionHeader = true,
}: Props) {
  const { ids, mounted, count } = useFavorites();
  const [clauses, setClauses] = useState<ClauseRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    if (ids.length === 0) {
      setClauses([]);
      return;
    }
    // Reverse so most-recently-favorited is first.
    const toFetch = [...ids].reverse().slice(0, limit ?? ids.length);
    setLoading(true);
    fetch(`/api/clauses?ids=${toFetch.join(",")}`)
      .then((r) => r.json())
      .then((data) => setClauses(data.results ?? []))
      .catch(() => setClauses([]))
      .finally(() => setLoading(false));
  }, [ids, mounted, limit]);

  // SSR / first paint — render nothing visible to avoid hydration mismatch.
  if (!mounted) return null;

  // Empty state
  if (count === 0) {
    return (
      <section className={withSectionHeader ? "mt-24" : ""}>
        {withSectionHeader && (
          <div className="mb-7">
            <p className="eyebrow mb-1">Your favorites</p>
            <h2 className="text-xl font-semibold tracking-tight">Saved clauses</h2>
          </div>
        )}
        <div className="surface p-8 text-center max-w-xl mx-auto">
          <Heart className="h-6 w-6 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No favorites yet</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tap the heart on any clause to save it here for later reference.
          </p>
          <Link
            href="/clauses"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4 font-medium"
          >
            Browse clauses
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  // Loading
  if (loading && clauses === null) {
    return (
      <section className={withSectionHeader ? "mt-24" : ""}>
        {withSectionHeader && (
          <div className="mb-7">
            <p className="eyebrow mb-1">Your favorites</p>
            <h2 className="text-xl font-semibold tracking-tight">Saved clauses</h2>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: Math.min(count, limit ?? count) }).map((_, i) => (
            <div key={i} className="surface p-5 h-40 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!clauses || clauses.length === 0) return null;

  const overflow = limit && count > limit;

  return (
    <section className={withSectionHeader ? "mt-24" : ""}>
      {withSectionHeader && (
        <div className="flex items-baseline justify-between mb-7">
          <div>
            <p className="eyebrow mb-1">Your favorites</p>
            <h2 className="text-xl font-semibold tracking-tight">
              Saved clauses{" "}
              <span className="text-muted-foreground font-normal tabular-nums">({count})</span>
            </h2>
          </div>
          {showSeeAll && overflow && (
            <Link
              href="/favorites"
              className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              See all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {clauses.map((c) => (
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
  );
}
