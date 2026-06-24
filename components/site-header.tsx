import Link from "next/link";
import { Suspense } from "react";
import { Scale } from "lucide-react";
import { SearchBar } from "./search-bar";
import { NavFavoritesLink } from "./nav-favorites-link";

export function SiteHeader() {
  return (
    <>
      {/* Thin authoritative red strip — the "official" signal */}
      <div className="brand-strip" />

      <header className="border-b border-border/60 sticky top-[3px] bg-background/95 backdrop-blur z-30">
        <div className="container h-16 flex items-center gap-8">
          {/* Identity block */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground transition-transform group-hover:scale-105"
              aria-hidden
            >
              <Scale className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight">
                SCG <span className="text-muted-foreground font-medium">OpenClauses</span>
              </span>
              <span className="eyebrow mt-1 text-[9px]">
                Clause library for SCG Legal
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground ml-2">
            <Link
              href="/clauses"
              className="hover:text-foreground transition-colors"
            >
              Clauses
            </Link>
            <Link
              href="/agreements"
              className="hover:text-foreground transition-colors"
            >
              Agreements
            </Link>
            <NavFavoritesLink />
            <Link
              href="/connect"
              className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-primary"
                aria-hidden
              />
              Use from AI
            </Link>
            <Link
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              About
            </Link>
          </nav>

          <div className="ml-auto w-full max-w-md hidden sm:block">
            <Suspense
              fallback={<div className="h-9 rounded-md border border-border/70 bg-card" />}
            >
              <SearchBar compact />
            </Suspense>
          </div>
        </div>
      </header>
    </>
  );
}
