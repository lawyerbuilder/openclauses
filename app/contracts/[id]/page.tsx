import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { QUERY_BY_SLUG } from "@/scripts/lib/queries";
import { getContractById, getClausesForContract } from "@/lib/search";
import { formatDate, truncate } from "@/lib/utils";

export const revalidate = 600;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const contract = await getContractById(Number(id)).catch(() => null);
  if (!contract) return { title: "Contract not found" };
  return {
    title: `${contract.filerName} — ${contract.title}`,
    description: truncate(contract.title, 160),
  };
}

export default async function ContractDetailPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) notFound();

  const contract = await getContractById(numericId);
  if (!contract) notFound();

  const clauses = await getClausesForContract(numericId);
  const agreementStrategy = contract.agreementType
    ? QUERY_BY_SLUG.get(contract.agreementType)
    : undefined;

  return (
    <div className="container py-12 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
        <article>
          <nav className="text-xs text-muted-foreground mb-4 flex flex-wrap items-center gap-1.5">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span className="text-border">/</span>
            <Link href="/agreements" className="hover:text-foreground transition-colors">
              Agreements
            </Link>
            {agreementStrategy && (
              <>
                <span className="text-border">/</span>
                <Link
                  href={`/agreements/${agreementStrategy.id}`}
                  className="hover:text-foreground transition-colors"
                >
                  {agreementStrategy.name}
                </Link>
              </>
            )}
          </nav>

          {agreementStrategy && (
            <p className="eyebrow mb-2">{agreementStrategy.name}</p>
          )}
          <h1 className="text-[1.625rem] sm:text-[2rem] font-semibold tracking-tight leading-tight">
            {contract.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{contract.filerName}</span>
            {contract.ticker ? (
              <span className="text-xs tabular-nums">({contract.ticker})</span>
            ) : null}
            <span className="text-border">·</span>
            <span>{contract.filingType}</span>
            <span className="text-border">·</span>
            <span className="tabular-nums">{formatDate(contract.filingDate)}</span>
          </div>

          <div className="mt-10">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <p className="eyebrow mb-1">Clauses</p>
                <h2 className="text-lg font-semibold tracking-tight">
                  {clauses.length} {clauses.length === 1 ? "clause" : "clauses"} in this agreement
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {clauses.map((c) => (
                <Link
                  key={c.id}
                  href={`/clauses/${c.id}`}
                  className="surface surface-hover p-5 block"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-[15px] leading-snug tracking-tight">
                      {c.heading?.trim() || `Section ${c.position}`}
                    </h3>
                    {c.clauseTypeSlug && c.clauseTypeName && (
                      <span className="shrink-0 rounded-full border border-border/70 bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {c.clauseTypeName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {truncate(c.text, 360)}
                  </p>
                  <div className="mt-3 text-xs text-muted-foreground tabular-nums">
                    {c.wordCount.toLocaleString()} words
                  </div>
                </Link>
              ))}
              {clauses.length === 0 && (
                <div className="surface p-6 text-sm text-muted-foreground">
                  No clauses were parsed from this contract.
                </div>
              )}
            </div>
          </div>
        </article>

        <aside className="space-y-5">
          <section className="surface p-5">
            <p className="eyebrow mb-3">Source filing</p>
            <Link
              href={contract.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-sm font-semibold leading-snug tracking-tight hover:text-primary transition-colors flex items-start gap-1.5"
            >
              <FileText className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <span className="flex-1">View on SEC EDGAR</span>
              <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
            </Link>
            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Filer</dt>
                <dd className="text-right font-medium">{contract.filerName}</dd>
              </div>
              {contract.counterparty && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Counterparty</dt>
                  <dd className="text-right font-medium">{contract.counterparty}</dd>
                </div>
              )}
              {contract.governingLaw && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Governing law</dt>
                  <dd className="text-right font-medium">{contract.governingLaw}</dd>
                </div>
              )}
              {contract.sicIndustry && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Industry</dt>
                  <dd className="text-right font-medium">{contract.sicIndustry}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Filing</dt>
                <dd className="text-right font-medium tabular-nums">
                  {contract.filingType} · {formatDate(contract.filingDate)}
                </dd>
              </div>
              {contract.exhibitNumber && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Exhibit</dt>
                  <dd className="text-right font-medium tabular-nums">
                    {contract.exhibitNumber}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Accession</dt>
                <dd className="text-right font-medium tabular-nums text-xs">
                  {contract.accessionNumber}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
