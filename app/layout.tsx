import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "OpenClauses — Free clause library from public contracts",
    template: "%s · OpenClauses",
  },
  description:
    "Search and browse contract clauses extracted from SEC EDGAR filings. A free, open alternative to Law Insider.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <footer className="border-t mt-16">
          <div className="container py-8 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-3">
            <p>
              OpenClauses · Clauses are extracted from public SEC EDGAR filings and presented for
              reference. Not legal advice.
            </p>
            <a
              href="https://github.com/Open-Source-Legal/OpenContracts"
              className="hover:text-foreground"
              target="_blank"
              rel="noreferrer noopener"
            >
              Open source
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
