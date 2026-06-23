import Link from "next/link";
import { Suspense } from "react";
import { ScrollText } from "lucide-react";
import { SearchBar } from "./search-bar";

export function SiteHeader() {
  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-30">
      <div className="container h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <ScrollText className="h-5 w-5 text-primary" />
          <span>OpenClauses</span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/clauses" className="hover:text-foreground">
            Browse
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
        </nav>
        <div className="ml-auto w-full max-w-md hidden sm:block">
          <Suspense fallback={<div className="h-9 rounded-lg border bg-card" />}>
            <SearchBar compact />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
