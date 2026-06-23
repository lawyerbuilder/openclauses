import Link from "next/link";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">About OpenClauses</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-foreground/90">
        <p>
          OpenClauses is a free, open clause library. We extract clauses from material contracts
          filed publicly with the U.S. Securities and Exchange Commission (SEC) and let you search
          them by clause type, keyword, or filing party.
        </p>
        <p>
          Every clause links back to the original SEC filing so you can verify the source. We do
          not host or modify the underlying documents — we only extract, classify, and index the
          clauses.
        </p>
        <p>
          <strong>This is not legal advice.</strong> Clauses are reproduced for reference and
          educational use. Always consult counsel before drafting your own agreements.
        </p>
        <h2 className="text-xl font-semibold pt-6">How it works</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            A nightly job queries SEC EDGAR for new material contract exhibits (typically Exhibit
            10.x of 10-K, 10-Q, and 8-K filings).
          </li>
          <li>Each exhibit is parsed into clauses by heading patterns.</li>
          <li>Clauses are classified by type (indemnification, termination, etc.).</li>
          <li>The full index is searchable via Postgres full-text search.</li>
        </ol>
        <p className="pt-4">
          <Link href="/" className="text-primary hover:underline">
            ← Back to search
          </Link>
        </p>
      </div>
    </div>
  );
}
