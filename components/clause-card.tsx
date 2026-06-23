import Link from "next/link";
import { truncate } from "@/lib/utils";

type Props = {
  id: number;
  heading: string | null;
  text: string;
  filerName: string;
  contractTitle: string;
  clauseTypeName?: string | null;
  clauseTypeSlug?: string | null;
  /** When true, render `text` as HTML (search snippets contain <mark> tags). */
  highlightedHtml?: boolean;
};

export function ClauseCard({
  id,
  heading,
  text,
  filerName,
  contractTitle,
  clauseTypeName,
  clauseTypeSlug,
  highlightedHtml = false,
}: Props) {
  return (
    <article className="group rounded-lg border bg-card p-5 hover:border-foreground/20 transition">
      <div className="flex items-start justify-between gap-4 mb-2">
        <Link href={`/clauses/${id}`} className="flex-1">
          <h3 className="font-semibold leading-snug group-hover:text-primary transition">
            {heading?.trim() || "Untitled clause"}
          </h3>
        </Link>
        {clauseTypeSlug && clauseTypeName && (
          <Link
            href={`/clauses?type=${clauseTypeSlug}`}
            className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground hover:bg-secondary/70"
          >
            {clauseTypeName}
          </Link>
        )}
      </div>
      {highlightedHtml ? (
        <p
          className="text-sm text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: text }}
        />
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">{truncate(text, 320)}</p>
      )}
      <div className="mt-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{filerName}</span> · {contractTitle}
      </div>
    </article>
  );
}
