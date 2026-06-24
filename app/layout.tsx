import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "SCG OpenClauses — Open clause library for SCG Legal",
    template: "%s · SCG OpenClauses",
  },
  description:
    "An open-source clause library built primarily for the lawyers at SCG Legal. Search contract clauses extracted from public SEC EDGAR filings.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border/60 mt-24 bg-card/40">
          <div className="container py-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-1 w-1 rounded-full bg-primary" />
              <span className="eyebrow text-foreground/80">SCG OpenClauses</span>
            </div>
            <p className="max-w-3xl leading-relaxed">
              An open-source clause library built primarily for the lawyers at SCG Legal. Clauses are
              extracted from public SEC EDGAR filings and presented for reference and research only.
              Not legal advice; not affiliated with the U.S. Securities and Exchange Commission,
              Law Insider, or any commercial clause-library service.
            </p>
            <p className="mt-4 text-xs">
              <a
                href="https://github.com/lawyerbuilder/openclauses"
                className="hover:text-foreground transition-colors"
                target="_blank"
                rel="noreferrer noopener"
              >
                Source on GitHub
              </a>
              <span className="mx-2 text-border">·</span>
              <a href="/about" className="hover:text-foreground transition-colors">
                About
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
