import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AGREEMENT_TYPES } from "@/scripts/lib/queries";
import { listAgreementTypeCounts } from "@/lib/search";

export const revalidate = 300;
export const metadata = { title: "Browse by agreement type" };

export default async function AgreementsPage() {
  const counts = await listAgreementTypeCounts().catch(() => []);
  const countBySlug = new Map(counts.map((c) => [c.slug, c]));

  // Group by category preserving the order defined in queries.ts
  const grouped = AGREEMENT_TYPES.reduce<
    Record<string, typeof AGREEMENT_TYPES>
  >((acc, t) => {
    const key = t.category;
    (acc[key] ??= [] as unknown as typeof AGREEMENT_TYPES).push(t);
    return acc;
  }, {});

  const totalContracts = counts.reduce((sum, c) => sum + c.contractCount, 0);

  return (
    <div className="container py-12">
      <header className="max-w-2xl mb-12">
        <p className="eyebrow mb-2">Browse</p>
        <h1 className="text-[2.25rem] font-semibold tracking-tight leading-tight">
          By agreement type
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Drill into the contracts behind the clauses. Each card is a category of agreement —
          supply, credit, license, employment — collected from SEC EDGAR.{" "}
          {totalContracts > 0 && (
            <span className="text-foreground font-medium tabular-nums">
              {totalContracts.toLocaleString()} contracts indexed.
            </span>
          )}
        </p>
      </header>

      <div className="space-y-12">
        {Object.entries(grouped).map(([category, types]) => (
          <section key={category}>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {category}
              </h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {types.length} {types.length === 1 ? "type" : "types"}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {types.map((t) => {
                const c = countBySlug.get(t.slug);
                const isEmpty = !c || c.contractCount === 0;
                return (
                  <Link
                    key={t.slug}
                    href={`/agreements/${t.slug}`}
                    className="surface surface-hover p-5 flex flex-col group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-semibold text-[15px] leading-snug tracking-tight">
                        {t.name}
                      </h3>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                    <div className="mt-auto pt-2 flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                      {isEmpty ? (
                        <span className="text-muted-foreground/60">No contracts yet</span>
                      ) : (
                        <>
                          <span>
                            <span className="font-semibold text-foreground">
                              {c!.contractCount.toLocaleString()}
                            </span>{" "}
                            {c!.contractCount === 1 ? "contract" : "contracts"}
                          </span>
                          <span className="text-border">·</span>
                          <span>
                            <span className="font-semibold text-foreground">
                              {c!.clauseCount.toLocaleString()}
                            </span>{" "}
                            clauses
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
