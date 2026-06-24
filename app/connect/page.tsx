import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

export const metadata = {
  title: "Connect to Claude",
  description: "Use SCG OpenClauses from Claude with Model Context Protocol.",
};

const MCP_URL = "https://scg-openclauses.vercel.app/api/mcp";

const CLAUDE_CODE_CMD = `claude mcp add --transport http openclauses ${MCP_URL}`;

const DESKTOP_JSON = `{
  "mcpServers": {
    "openclauses": {
      "command": "npx",
      "args": ["mcp-remote", "${MCP_URL}"]
    }
  }
}`;

const SAMPLE_PROMPTS = [
  "Find me an indemnification clause from a tech company.",
  "Compare three force majeure clauses that explicitly mention pandemics.",
  "What's the most aggressive non-compete clause in OpenClauses?",
  "Show me a license grant clause with worldwide, non-exclusive scope.",
  "Find a settlement agreement clause with a mutual release.",
];

export default function ConnectPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <header className="mb-12">
        <p className="eyebrow mb-2">Integration</p>
        <h1 className="text-[2.25rem] font-semibold tracking-tight leading-tight">
          Use SCG OpenClauses from Claude
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          OpenClauses runs an <strong className="text-foreground font-semibold">MCP server</strong>{" "}
          (Model Context Protocol). Connect any MCP-aware Claude — claude.ai web, Claude Desktop,
          Claude Code — and ask the library questions directly. Below are the exact steps for each.
        </p>
      </header>

      {/* claude.ai web */}
      <section className="surface p-6 sm:p-7 mb-6">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <h2 className="text-lg font-semibold tracking-tight">claude.ai (web)</h2>
          <span className="eyebrow">Easiest</span>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          For most users. Works in any browser, no install. Requires Anthropic Pro/Team/Enterprise.
        </p>

        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              1
            </span>
            <div className="flex-1">
              Open{" "}
              <a
                href="https://claude.ai/settings/connectors"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                claude.ai → Settings → Connectors
                <ExternalLink className="h-3 w-3" />
              </a>
              .
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              2
            </span>
            <div className="flex-1">
              Click <strong className="font-semibold">Add custom connector</strong> and paste this
              URL:
              <div className="mt-2 surface p-3 flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-foreground break-all">
                  {MCP_URL}
                </code>
                <CopyButton text={MCP_URL} label="Copy" />
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              3
            </span>
            <div className="flex-1">
              Save. Start a new chat — Claude will discover the OpenClauses tools automatically.
            </div>
          </li>
        </ol>
      </section>

      {/* Claude Desktop */}
      <section className="surface p-6 sm:p-7 mb-6">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <h2 className="text-lg font-semibold tracking-tight">Claude Desktop</h2>
          <span className="eyebrow">Mac &amp; Windows app</span>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          For the desktop Claude app. One-line config edit, then restart.
        </p>

        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              1
            </span>
            <div className="flex-1">
              In Claude Desktop, open{" "}
              <strong className="font-semibold">Settings → Developer → Edit Config</strong>.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              2
            </span>
            <div className="flex-1">
              Replace (or merge into) the file&apos;s contents with this:
              <div className="mt-2 surface p-3 flex items-start gap-2">
                <pre className="flex-1 text-xs font-mono text-foreground overflow-x-auto whitespace-pre">
                  {DESKTOP_JSON}
                </pre>
                <CopyButton text={DESKTOP_JSON} label="Copy" />
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              3
            </span>
            <div className="flex-1">Save the file and restart Claude Desktop.</div>
          </li>
        </ol>

        <p className="mt-5 text-xs text-muted-foreground">
          The first run downloads <code className="rounded bg-secondary px-1 py-0.5">mcp-remote</code>{" "}
          via <code className="rounded bg-secondary px-1 py-0.5">npx</code> — requires Node.js
          installed locally.
        </p>
      </section>

      {/* Claude Code */}
      <section className="surface p-6 sm:p-7 mb-6">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <h2 className="text-lg font-semibold tracking-tight">Claude Code (CLI)</h2>
          <span className="eyebrow">Developers</span>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          One command. Then restart your Claude Code session.
        </p>

        <div className="surface p-3 flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-foreground break-all">
            {CLAUDE_CODE_CMD}
          </code>
          <CopyButton text={CLAUDE_CODE_CMD} label="Copy" />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Paste in any terminal. The config is written to{" "}
          <code className="rounded bg-secondary px-1 py-0.5">~/.claude.json</code>, so it works
          across every project. After it&apos;s added, close and reopen your{" "}
          <code className="rounded bg-secondary px-1 py-0.5">claude</code> session for it to be
          picked up.
        </p>
      </section>

      {/* Sample prompts */}
      <section className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Try asking</h2>
        </div>
        <ul className="space-y-2">
          {SAMPLE_PROMPTS.map((p) => (
            <li key={p} className="surface px-4 py-3 flex items-center gap-3">
              <span className="flex-1 text-sm italic text-foreground/90">&ldquo;{p}&rdquo;</span>
              <CopyButton text={p} />
            </li>
          ))}
        </ul>
      </section>

      {/* What tools Claude sees */}
      <section className="mt-12">
        <p className="eyebrow mb-2">Tools exposed</p>
        <h2 className="text-lg font-semibold tracking-tight mb-4">
          What Claude can call
        </h2>
        <div className="surface divide-y divide-border/60">
          {[
            ["search_clauses", "Full-text search with highlighted snippets and optional type filter"],
            ["get_clause", "Full text of a specific clause plus its source attribution"],
            ["list_clause_types", "The 27-slug taxonomy with per-type clause counts"],
            ["find_similar_clauses", "Other clauses of the same type — compare drafts side by side"],
            ["list_recent_clauses", "Newest additions, useful for sanity checks"],
          ].map(([name, desc]) => (
            <div key={name} className="p-4 flex items-start gap-3">
              <code className="text-xs font-mono font-semibold text-primary shrink-0 mt-0.5 w-44">
                {name}
              </code>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 text-sm">
        <Link
          href="/"
          className="text-primary hover:underline font-medium inline-flex items-center gap-1"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
          Back to search
        </Link>
      </p>
    </div>
  );
}
