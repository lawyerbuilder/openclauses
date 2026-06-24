# OpenClauses

A free, open clause library — search and browse contract clauses extracted from public SEC EDGAR filings. Think Law Insider, but free and open.

> **Status:** MVP scaffold. Search + browse + clause detail are wired up against a Drizzle/Postgres schema. An EDGAR ingestion script seeds the index from public filings, with optional Groq-via-AI-Gateway classification.

## Stack

- Next.js 15 App Router (TypeScript)
- Tailwind CSS + lucide-react icons (shadcn-style primitives inlined; add the CLI later if you want more)
- Neon Postgres via `@neondatabase/serverless` + Drizzle ORM
- Postgres full-text search (`tsvector`, `websearch_to_tsquery`, `ts_headline`)
- Vercel deployment (Fluid Compute Functions, optional Vercel Cron for nightly ingestion)

## Quickstart

### 1. Install

```bash
npm install
```

### 2. Provision a database (Neon, via Vercel Marketplace)

The fastest path:

```bash
# install the CLI if you don't have it
npm i -g vercel

# from the project root
vercel link          # connect this folder to a Vercel project
vercel storage add   # pick "Neon" → follow prompts
vercel env pull      # writes DATABASE_URL into .env.local
```

Or, if you'd rather wire it up by hand: provision Neon (or any Postgres) elsewhere and put the connection string in `.env.local`:

```
DATABASE_URL=postgres://...?sslmode=require
EDGAR_USER_AGENT="OpenClauses ingest you@example.com"
```

### 3. Create the schema

The initial schema is checked in at `drizzle/0000_init.sql` — it's the source of truth because it includes the `tsvector` generated column for full-text search, which `db:push` doesn't model. Apply it directly:

```bash
psql "$DATABASE_URL" -f drizzle/0000_init.sql
```

(`db:push` will still work for incremental changes to non-generated columns going forward.)

### 4. Seed demo content

```bash
npm run seed
```

This loads ~30 clause types and ~20 hand-curated clauses so the homepage has something to render before EDGAR ingestion finishes.

### 5. Run dev

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Ingest real clauses

Two ingestion modes, pick the one that matches your goal:

**A. Quick one-shot — `npm run ingest:edgar`** — single EDGAR full-text query (the default `"material contract"`), top N results. Good for smoke-testing setup. Tune with `EDGAR_MAX_FILINGS=N`.

**B. Bulk ingest — `npm run ingest:bulk`** — round-robins through 30 query strategies (supply / credit / merger / employment / IP / settlement / etc.) and paginates each. This is what builds real breadth. Budgets:

| Env var | Default | Purpose |
|---|---|---|
| `INGEST_MAX_MINUTES` | 30 | Wall-clock stop |
| `INGEST_MAX_CONTRACTS` | 200 | Stop after N *new* contracts |
| `INGEST_CONCURRENCY` | 3 | Parallel exhibit downloads (SEC's published cap is 10 req/s) |
| `INGEST_PAGES_PER_QUERY` | 5 | EDGAR pages of 100 results to walk per query |

Ctrl+C is safe — it lets in-flight work finish, then exits. Restart picks up where it left off because the contracts table uses `(accession_number, exhibit_number)` as a unique key. Examples:

```bash
# small test (~5 min, ~25 new contracts)
INGEST_MAX_MINUTES=5 INGEST_MAX_CONTRACTS=25 npm run ingest:bulk

# overnight breadth run
INGEST_MAX_MINUTES=600 INGEST_MAX_CONTRACTS=2000 npm run ingest:bulk
```

Both modes pull exhibit HTML, split by heading patterns, classify each clause, and upsert into Postgres. Already-ingested accession numbers are deduped silently.

Classification has two paths:
- **Default (keyword rules)** — fast, free, no setup. Works fine for headings like "INDEMNIFICATION" or "Section 8. Confidentiality"; misses creative headings.
- **LLM (Groq via Vercel AI Gateway)** — better recall. Set `AI_GATEWAY_API_KEY` (get one from your Vercel project → AI tab) and it kicks in automatically. Default model is `groq/llama-3.3-70b-versatile` — fast and free-tier-friendly. Override via `OPENCLAUSES_CLASSIFIER_MODEL`. On Vercel itself, OIDC handles auth and no key is needed.

Tune via env:

- `EDGAR_MAX_FILINGS` — how many candidates to attempt (default 15)
- `EDGAR_REQUEST_DELAY_MS` — throttle between EDGAR requests (default 125 ms; SEC's published cap is 10 req/s)
- `EDGAR_USER_AGENT` — **required**, must be a descriptive `Name email@example.com`

## Deploying to Vercel (Path B: local dev + Vercel deploy)

1. **Push the code to GitHub.** From `D:\dev\openclauses\`:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/openclauses.git
   git push -u origin main
   ```
2. **Import on Vercel.** New Project → pick the repo. It auto-detects Next.js. Don't deploy yet — finish env vars first.
3. **Provision Neon.** In the project's *Storage* tab, add Neon from the Marketplace. `DATABASE_URL` is wired automatically into Production/Preview/Development envs.
4. **Apply the schema.** Open Neon's *SQL Console* (link is in the Vercel Storage tab), paste the contents of `drizzle/0000_init.sql`, and run.
5. **Set env vars** in *Project → Settings → Environment Variables*:
   - `EDGAR_USER_AGENT` = `"OpenClauses ingest you@example.com"`
   - `AI_GATEWAY_API_KEY` = from *Project → AI* tab (optional but recommended)
   - `CRON_SECRET` = any random string (only matters if you wire up the cron route)
6. **`vercel env pull`** locally so your dev environment has the same vars (`npm i -g vercel` first if needed).
7. **Trigger the first deploy.** Either push another commit or click *Deploy* in the Vercel dashboard.
8. **Seed.** From your machine: `npm run seed`. (The seed script writes through `DATABASE_URL`, which now points at the same Neon db Vercel uses.)
9. **First real ingest.** From your machine: `EDGAR_MAX_FILINGS=15 npm run ingest:edgar`.

After that: iterate locally with `npm run dev`, commit and push — preview deploys go up automatically.

> The cron entry in `vercel.ts` points at `/api/ingest/edgar`, which is currently a stub. To actually run ingestion in-platform, lift the modules from `scripts/lib/` into `lib/edgar/` and call them from the route. Until then, run ingestion locally on whatever cadence you want.

## Project layout

```
app/
  layout.tsx            # site shell
  page.tsx              # homepage (search hero + recent + browse)
  search/page.tsx       # search results, FTS + ts_headline snippets
  clauses/page.tsx      # browse all / by type
  clauses/[id]/page.tsx # clause detail + source link
  api/search/route.ts   # JSON search endpoint
  api/ingest/edgar/route.ts # cron stub
components/
  site-header.tsx, search-bar.tsx, clause-card.tsx
lib/
  db/index.ts           # Neon + Drizzle client
  db/schema.ts          # Drizzle schema
  search.ts             # search query helpers
  utils.ts
scripts/
  seed.ts                # apply demo content
  ingest-edgar.ts        # SEC EDGAR ingestion
  lib/edgar.ts           # EDGAR HTTP client
  lib/parse-clauses.ts   # HTML → clauses (heading splitter)
  lib/classify.ts        # keyword-based clause-type classifier
  lib/classify-llm.ts    # AI Gateway (Groq) classifier — opt-in via env
  seed-data/             # clause-types + demo clauses JSON
drizzle/0000_init.sql   # initial schema
vercel.ts               # typed project config (vercel.json replacement)
```

## Use it from Claude (or any MCP client)

OpenClauses exposes itself as an MCP server at **`/api/mcp`**. Once your project is deployed, any MCP-compatible AI client can call it. No auth required (clauses are public).

### Tools exposed

| Tool | Purpose |
|---|---|
| `search_clauses(query, type?, limit?)` | Full-text search with highlighted snippets |
| `get_clause(id)` | Full clause text + complete source attribution |
| `list_clause_types()` | The 27-slug taxonomy with per-type clause counts |
| `find_similar_clauses(clause_id, limit?)` | Other clauses of the same type — compare drafts |
| `list_recent_clauses(limit?)` | Newest additions, useful for sanity checks |

### Connect from each Claude surface

**Claude Code** (your CLI):
```bash
claude mcp add openclauses https://openclauses-zeta.vercel.app/api/mcp
```

**Claude Desktop**: edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):
```json
{
  "mcpServers": {
    "openclauses": {
      "command": "npx",
      "args": ["mcp-remote", "https://openclauses-zeta.vercel.app/api/mcp"]
    }
  }
}
```

**claude.ai web**: Settings → Connectors → Add custom connector → URL: `https://openclauses-zeta.vercel.app/api/mcp`

**Cursor / Zed / Continue / other MCP-aware tools**: use the URL above with HTTP transport.

### Example prompts once connected

> *Find me an assignment clause from a tech company.*
>
> *Compare Apple and Microsoft's indemnification clauses.*
>
> *Show me three recent force majeure clauses that explicitly mention pandemics.*
>
> *What's the longest non-compete clause in OpenClauses?*

Claude will pick the right tool(s) automatically.

## Notes & limitations

- **No auth** in the MVP. Everything is public, like Law Insider's clause search.
- **Source attribution**: every clause links back to the original SEC filing. Clauses are reproduced for reference, not as legal advice.
- **LLM classifier** is opt-in via `AI_GATEWAY_API_KEY`. Without it the keyword rules in `scripts/lib/classify.ts` still produce a usable (if blunter) index.

## License

TBD — the repo is open source by design; pick MIT or Apache-2.0 before public launch.
