import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { CopyButton } from "@/components/copy-button";

export const metadata = {
  title: "Connect to Claude",
  description: "Use SCG OpenClauses from Claude with Model Context Protocol.",
};

const MCP_URL = "https://scg-openclauses.vercel.app/api/mcp";
const OPENAPI_URL = "https://scg-openclauses.vercel.app/openapi.json";

const CLAUDE_CODE_CMD = `claude mcp add --transport http openclauses ${MCP_URL}`;

const GPT_INSTRUCTIONS = `You are SCG OpenClauses, a research assistant for lawyers at SCG Legal.

When a user describes a contract situation or asks about a clause:
1. If unsure which clause type fits, call listClauseTypes first to see the taxonomy.
2. Use searchClauses with a precise query, optionally filtered by clause type.
3. When citing a clause, link to its detailUrl so the user can read the full text.
4. For "what kind of agreement?" questions, call listAgreementTypes first.
5. Be direct. Cite specific clauses with id numbers. Never make up clauses.
6. Always include the disclaimer: "Not legal advice — these are reference clauses from public SEC filings."`;

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

      {/* ChatGPT Custom GPT */}
      <section className="surface p-6 sm:p-7 mb-6">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <h2 className="text-lg font-semibold tracking-tight">ChatGPT (Custom GPT)</h2>
          <span className="eyebrow">Plus / Team / Enterprise</span>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Build a Custom GPT once. Share the link with the SCG Legal team so everyone gets the same
          assistant.
        </p>

        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              1
            </span>
            <div className="flex-1">
              Open{" "}
              <a
                href="https://chatgpt.com/gpts/editor"
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                chatgpt.com/gpts/editor
                <ExternalLink className="h-3 w-3" />
              </a>
              . Click <strong className="font-semibold">Create</strong>.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              2
            </span>
            <div className="flex-1">
              Switch to the <strong className="font-semibold">Configure</strong> tab. Name it{" "}
              <em>SCG OpenClauses</em>. Optionally upload a logo.
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              3
            </span>
            <div className="flex-1">
              In the <strong className="font-semibold">Instructions</strong> box, paste:
              <div className="mt-2 surface p-3 flex items-start gap-2">
                <pre className="flex-1 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">
                  {GPT_INSTRUCTIONS}
                </pre>
                <CopyButton text={GPT_INSTRUCTIONS} label="Copy" />
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              4
            </span>
            <div className="flex-1">
              Scroll down to <strong className="font-semibold">Actions</strong> →{" "}
              <strong className="font-semibold">Create new action</strong>. In the{" "}
              <strong className="font-semibold">Schema</strong> section, click{" "}
              <strong className="font-semibold">Import from URL</strong> and paste:
              <div className="mt-2 surface p-3 flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-foreground break-all">
                  {OPENAPI_URL}
                </code>
                <CopyButton text={OPENAPI_URL} label="Copy" />
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              5
            </span>
            <div className="flex-1">
              Authentication: <strong className="font-semibold">None</strong> (clauses are public).
              Privacy policy URL: any URL works; you can paste{" "}
              <code className="rounded bg-secondary px-1 py-0.5">
                https://scg-openclauses.vercel.app/about
              </code>
              .
            </div>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
              6
            </span>
            <div className="flex-1">
              Click <strong className="font-semibold">Create</strong> (top right). Choose{" "}
              <strong className="font-semibold">Only me</strong> to test, then later switch to{" "}
              <strong className="font-semibold">Anyone with the link</strong> and share with the SCG
              Legal team.
            </div>
          </li>
        </ol>

        <p className="mt-5 text-xs text-muted-foreground">
          Built on the public{" "}
          <a
            href={OPENAPI_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground underline"
          >
            OpenAPI spec
          </a>
          . Read-only — your GPT can only search and fetch clauses, never modify the library.
        </p>
      </section>

      {/* Other tools — honest about what's not supported */}
      <section className="surface p-6 sm:p-7 mb-6">
        <h2 className="text-lg font-semibold tracking-tight mb-2">
          Gemini, Perplexity, M365 Copilot
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          These tools don&apos;t currently expose a way for end users to add custom APIs from their
          consumer chat interfaces. Two workarounds:
        </p>
        <ol className="space-y-2 text-sm pl-5 list-decimal marker:text-muted-foreground">
          <li>
            Use{" "}
            <Link href="/" className="text-primary hover:underline font-medium">
              the SCG OpenClauses web app
            </Link>{" "}
            directly, then paste any clause text into your preferred tool.
          </li>
          <li>
            Use Claude or ChatGPT for OpenClauses-driven research, then bring the answer back to
            Gemini/Perplexity for whatever you&apos;re drafting.
          </li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">
          We&apos;ll add native integrations as these platforms ship plugin/connector frameworks.
          The same{" "}
          <a
            href={OPENAPI_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground underline"
          >
            OpenAPI spec
          </a>{" "}
          will work the moment they support it.
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
