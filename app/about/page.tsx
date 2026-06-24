import Link from "next/link";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container py-16 max-w-2xl">
      <p className="eyebrow mb-2">About</p>
      <h1 className="text-[2rem] font-semibold tracking-tight leading-tight">
        SCG OpenClauses
      </h1>

      <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-foreground/90">
        <p>
          <strong className="font-semibold">SCG OpenClauses</strong> is an open-source clause
          library built primarily for the lawyers at SCG Legal. It extracts clauses from material
          contracts filed publicly with the U.S. Securities and Exchange Commission (SEC) and lets
          you search them by clause type, keyword, or filing party.
        </p>
        <p>
          Every clause links back to the original SEC filing so you can verify the source. We do
          not host or modify the underlying documents — we only extract, classify, and index the
          clauses.
        </p>

        <h2 className="text-xl font-semibold tracking-tight pt-8">How it works</h2>
        <ol className="list-decimal pl-5 space-y-2.5 marker:text-muted-foreground">
          <li>
            A background ingestion job queries SEC EDGAR full-text search across 30 different
            contract-type queries (supply, credit, license, merger, employment, IP, etc.).
          </li>
          <li>
            For each match, the exhibit HTML is fetched and split into clauses by heading patterns.
          </li>
          <li>
            Clauses are classified by type — keyword rules first, optionally Groq Llama as a
            fallback for ambiguous headings.
          </li>
          <li>
            The full index is searchable via Postgres full-text search, with highlighted snippets
            and per-clause source attribution.
          </li>
        </ol>

        <h2 className="text-xl font-semibold tracking-tight pt-8">Use it from Claude</h2>
        <p>
          SCG OpenClauses exposes itself as a{" "}
          <span className="font-semibold">Model Context Protocol (MCP)</span> server. Connect any
          MCP-aware Claude surface (claude.ai web, Claude Desktop, Claude Code) to the URL{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 text-[13px] font-mono">
            /api/mcp
          </code>{" "}
          and you can ask Claude to find, compare, and cite clauses by name. See the{" "}
          <a
            href="https://github.com/lawyerbuilder/openclauses#use-it-from-claude-or-any-mcp-client"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary hover:underline font-medium"
          >
            README
          </a>{" "}
          for setup steps.
        </p>

        <h2 className="text-xl font-semibold tracking-tight pt-8">Disclaimer</h2>
        <div className="surface p-5 sm:p-6 space-y-3 text-sm">
          <div className="flex items-start gap-2.5">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
            <p>
              <strong className="font-semibold">
                Intended for the internal use of SCG personnel only.
              </strong>{" "}
              SCG OpenClauses is provided primarily for lawyers and compliance professionals at
              SCG Legal as a research and reference tool.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden
            />
            <p>
              <strong className="font-semibold">SCG OpenClauses is not legal advice.</strong>{" "}
              Clauses are reproduced for reference, research, and education only. Always consult
              qualified counsel before drafting or relying on contract language.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40"
              aria-hidden
            />
            <p>
              No warranty; no liability. The Platform is provided "as is." This project is not
              affiliated with the U.S. Securities and Exchange Commission, Law Insider, or any
              commercial clause-library service.
            </p>
          </div>
          <p className="text-sm pt-1">
            See the full{" "}
            <Link href="/terms" className="text-primary hover:underline font-medium">
              Terms of Use
            </Link>{" "}
            for complete details.
          </p>
        </div>

        <p className="pt-6 text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline font-medium">
            ← Back to search
          </Link>
          <span className="mx-2 text-border">·</span>
          <a
            href="https://github.com/lawyerbuilder/openclauses"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground transition-colors"
          >
            Source on GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
