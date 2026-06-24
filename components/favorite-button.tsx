"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";

type Props = {
  clauseId: number;
  size?: "sm" | "md";
  className?: string;
};

export function FavoriteButton({ clauseId, size = "sm", className }: Props) {
  const { isFavorite, toggle, mounted } = useFavorites();
  const favorited = mounted && isFavorite(clauseId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(clauseId);
      }}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      title={favorited ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-full transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        size === "sm" && "h-7 w-7",
        size === "md" && "h-9 w-9",
        favorited
          ? "text-primary hover:text-primary/80 bg-primary/[0.08] hover:bg-primary/[0.12]"
          : "text-muted-foreground/50 hover:text-primary hover:bg-primary/[0.06]",
        className
      )}
    >
      <Heart
        className={cn(
          size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]",
          "transition-transform",
          favorited && "fill-current scale-105"
        )}
        strokeWidth={favorited ? 2 : 1.75}
      />
    </button>
  );
}
