import Link from "next/link";
import { truncate } from "@/lib/utils";
import { FavoriteButton } from "./favorite-button";

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
    <article className="group surface surface-hover p-5 relative">
      <div className="absolute top-3 right-3">
        <FavoriteButton clauseId={id} size="sm" />
      </div>

      <div className="flex items-start justify-between gap-4 mb-2.5 pr-9">
        <Link href={`/clauses/${id}`} className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] leading-snug tracking-tight group-hover:text-primary transition-colors">
            {heading?.trim() || "Untitled clause"}
          </h3>
        </Link>
        {clauseTypeSlug && clauseTypeName && (
          <Link
            href={`/clauses?type=${clauseTypeSlug}`}
            className="shrink-0 rounded-full border border-border/70 bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground hover:bg-secondary hover:border-foreground/20 transition"
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
      <div className="mt-3.5 text-xs text-muted-foreground flex items-center gap-1.5">
        <span className="font-semibold text-foreground">{filerName}</span>
        <span className="text-border">·</span>
        <span className="truncate">{contractTitle}</span>
      </div>
    </article>
  );
}
