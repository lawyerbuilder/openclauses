"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";

export function NavFavoritesLink() {
  const { count, mounted } = useFavorites();
  return (
    <Link
      href="/favorites"
      className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
      title="Your saved clauses"
    >
      <Heart
        className="h-3.5 w-3.5"
        strokeWidth={2}
        fill={mounted && count > 0 ? "currentColor" : "none"}
      />
      <span>Favorites</span>
      {mounted && count > 0 && (
        <span className="tabular-nums text-[10px] font-semibold rounded-full bg-primary/10 text-primary px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none">
          {count}
        </span>
      )}
    </Link>
  );
}
