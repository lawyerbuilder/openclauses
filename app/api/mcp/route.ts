// MCP server for OpenClauses.
// Exposes the clause library as tools that Claude (and any MCP-compatible
// client) can call. No auth in v1 — clauses are public anyway.
//
// Connect from:
//   Claude Code:    claude mcp add openclauses https://openclauses-zeta.vercel.app/api/mcp
//   Claude Desktop: configure mcp-remote bridge pointing at the same URL
//   claude.ai web:  Settings → Connectors → Add → URL above
//   Cursor / Zed:   MCP HTTP transport, same URL

import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  searchClauses,
  countClauses,
  listClauseTypes,
  getClauseById,
  getRelatedClauses,
  listRecentClauses,
} from "@/lib/search";

const SITE = process.env.OPENCLAUSES_SITE_URL ?? "https://openclauses-zeta.vercel.app";

function detailUrl(id: number): string {
  return `${SITE}/clauses/${id}`;
}

function stripMarkTags(text: string): string {
  // FTS snippets contain <mark>…</mark>. Convert to **bold** for plain-text consumers.
  return text.replace(/<mark>/g, "**").replace(/<\/mark>/g, "**");
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "search_clauses",
      "Full-text search across the OpenClauses library of contract clauses extracted from public SEC EDGAR filings. " +
        "Returns matching clauses with highlighted snippets and source attribution. " +
        "Use `type` to filter by clause-type slug (call `list_clause_types` first to see options).",
      {
        query: z.string().describe('Search query — e.g. "indemnification", "force majeure carve-out for pandemics"'),
        type: z
          .string()
          .optional()
          .describe("Optional clause-type slug to filter by (e.g. \"indemnification\", \"governing-law\")"),
        limit: z.number().int().min(1).max(20).optional().describe("Max results to return (1-20, default 10)"),
      },
      async ({ query, type, limit }) => {
        const max = limit ?? 10;
        const [results, total] = await Promise.all([
          searchClauses({ query, typeSlug: type, limit: max }),
          countClauses({ query, typeSlug: type }),
        ]);
        const payload = {
          query,
          type: type ?? null,
          total,
          returned: results.length,
          results: results.map((r) => ({
            id: r.id,
            heading: r.heading,
            snippet: stripMarkTags(r.text),
            type: r.clauseTypeName,
            typeSlug: r.clauseTypeSlug,
            filer: r.filerName,
            contract: r.contractTitle,
            filing: `${r.filingType} ${r.filingDate}`,
            sourceUrl: r.sourceUrl,
            detailUrl: detailUrl(r.id),
            rank: Number(r.rank.toFixed(4)),
          })),
        };
        return {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        };
      }
    );

    server.tool(
      "get_clause",
      "Fetch the full text of a specific clause by its ID. Use this after `search_clauses` " +
        "when the user wants to see a complete clause rather than a snippet.",
      {
        id: z.number().int().describe("Clause ID returned by search_clauses"),
      },
      async ({ id }) => {
        const clause = await getClauseById(id);
        if (!clause) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Clause not found", id }) }],
            isError: true,
          };
        }
        const payload = {
          id: clause.id,
          heading: clause.heading,
          text: clause.text,
          type: clause.clauseTypeName,
          typeSlug: clause.clauseTypeSlug,
          wordCount: clause.wordCount,
          contract: {
            id: clause.contractId,
            title: clause.contractTitle,
            filer: clause.filerName,
            ticker: clause.ticker,
            industry: clause.sicIndustry,
            filingType: clause.filingType,
            filingDate: clause.filingDate,
            counterparty: clause.counterparty,
            governingLaw: clause.governingLaw,
            sourceUrl: clause.sourceUrl,
          },
          detailUrl: detailUrl(clause.id),
        };
        return {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        };
      }
    );

    server.tool(
      "list_clause_types",
      "List every clause type in the OpenClauses taxonomy, with counts. " +
        "Call this first if the user wants to filter or browse by type, " +
        "or to discover which slugs you can pass to `search_clauses`.",
      {},
      async () => {
        const types = await listClauseTypes();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  total: types.length,
                  types: types.map((t) => ({
                    slug: t.slug,
                    name: t.name,
                    description: t.description,
                    category: t.category,
                    clauseCount: t.clauseCount,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );

    server.tool(
      "find_similar_clauses",
      "Given a clause ID, find other clauses of the same type. Useful for comparing how " +
        "different parties draft the same kind of provision (e.g. how Apple's indemnification " +
        "compares to Microsoft's).",
      {
        clause_id: z.number().int().describe("Reference clause ID"),
        limit: z.number().int().min(1).max(15).optional().describe("Max related clauses to return (1-15, default 6)"),
      },
      async ({ clause_id, limit }) => {
        const ref = await getClauseById(clause_id);
        if (!ref) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Clause not found", id: clause_id }) }],
            isError: true,
          };
        }
        const related = await getRelatedClauses(ref.clauseTypeId, clause_id, limit ?? 6);
        const payload = {
          reference: {
            id: ref.id,
            heading: ref.heading,
            type: ref.clauseTypeName,
            filer: ref.filerName,
          },
          related: related.map((r) => ({
            id: r.id,
            heading: r.heading,
            snippet: r.text,
            filer: r.filerName,
            contract: r.contractTitle,
            detailUrl: detailUrl(r.id),
          })),
        };
        return {
          content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
        };
      }
    );

    server.tool(
      "list_recent_clauses",
      "List the most recently ingested clauses. Useful for showing the user what's new " +
        "or for sanity-checking the corpus after a fresh ingestion run.",
      {
        limit: z.number().int().min(1).max(25).optional().describe("Number of recent clauses to return (1-25, default 10)"),
      },
      async ({ limit }) => {
        const recent = await listRecentClauses(limit ?? 10);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  count: recent.length,
                  clauses: recent.map((c) => ({
                    id: c.id,
                    heading: c.heading,
                    snippet: c.text,
                    type: c.clauseTypeName,
                    typeSlug: c.clauseTypeSlug,
                    filer: c.filerName,
                    contract: c.contractTitle,
                    detailUrl: detailUrl(c.id),
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );
  },
  {
    // server info — surfaced to MCP clients during the initialize handshake
    serverInfo: {
      name: "openclauses",
      version: "0.1.0",
    },
  },
  {
    // route config
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: false,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
