// OpenAPI 3.0 spec for the SCG OpenClauses REST API.
// Paste the URL of this route into ChatGPT → Custom GPT → Configure → Actions
// → "Import from URL" to get one-click integration.
//
// Cached for 24h since the shape changes rarely; bump the version below when
// you add/remove fields so consumers know to reload.

import { NextResponse } from "next/server";

const SITE = "https://scg-openclauses.vercel.app";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "SCG OpenClauses API",
    version: "1.0.0",
    description:
      "Search and browse contract clauses extracted from public SEC EDGAR filings. " +
      "Open-source clause library built primarily for the lawyers at SCG Legal. " +
      "Not legal advice; not affiliated with the SEC or any commercial clause service.",
    contact: {
      url: `${SITE}/about`,
    },
  },
  servers: [{ url: SITE }],
  paths: {
    "/api/search": {
      get: {
        operationId: "searchClauses",
        summary: "Full-text search across all indexed clauses",
        description:
          "Returns clauses matching the query, ranked by relevance. Each result includes a highlighted snippet, the source filer and contract, and a detail URL. " +
          "Use the `type` parameter to filter by clause-type slug (call /api/clause-types to discover slugs).",
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description:
              'The search query. Phrases auto-detected. Examples: "indemnification", "force majeure pandemic", "non-compete two years".',
            schema: { type: "string" },
          },
          {
            name: "type",
            in: "query",
            required: false,
            description:
              "Optional clause-type slug to filter by (e.g. indemnification, governing-law). Call /api/clause-types for the full list.",
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Max results to return (1-50, default 20).",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
          },
          {
            name: "offset",
            in: "query",
            required: false,
            description: "Pagination offset (default 0).",
            schema: { type: "integer", minimum: 0, default: 0 },
          },
        ],
        responses: {
          "200": {
            description: "Search results with total count.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SearchResults" },
              },
            },
          },
        },
      },
    },
    "/api/clauses/{id}": {
      get: {
        operationId: "getClause",
        summary: "Fetch a single clause by ID with full text and source attribution",
        description:
          "Use after `searchClauses` when the user wants to see a complete clause rather than a snippet. " +
          "Returns the full clause text, contract metadata, and source URL.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Clause ID returned by searchClauses.",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": {
            description: "The full clause and its source contract.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClauseDetail" },
              },
            },
          },
          "404": {
            description: "Clause not found.",
          },
        },
      },
    },
    "/api/clause-types": {
      get: {
        operationId: "listClauseTypes",
        summary: "List the 27-slug clause-type taxonomy with counts",
        description:
          "Returns every clause-type slug, display name, description, category, and clause count. " +
          "Call this first when the user wants to filter or browse by type, or to discover which slugs are valid for /api/search.",
        responses: {
          "200": {
            description: "Clause-type list.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ClauseTypeList" },
              },
            },
          },
        },
      },
    },
    "/api/agreements": {
      get: {
        operationId: "listAgreementTypes",
        summary: "List agreement types in the OpenClauses taxonomy with counts",
        description:
          "Returns every agreement-type slug (supply, license, credit, employment, etc.), display name, description, category, and per-type contract + clause counts. " +
          "Use this to recommend the right kind of agreement template for a user's situation.",
        responses: {
          "200": {
            description: "Agreement-type list.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AgreementTypeList" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      SearchResults: {
        type: "object",
        required: ["results", "total"],
        properties: {
          query: { type: "string" },
          total: { type: "integer", description: "Total clauses matching the query." },
          results: {
            type: "array",
            items: { $ref: "#/components/schemas/SearchHit" },
          },
        },
      },
      SearchHit: {
        type: "object",
        required: ["id", "text", "filerName"],
        properties: {
          id: { type: "integer" },
          heading: { type: ["string", "null"] },
          text: {
            type: "string",
            description: "Highlighted snippet with <mark> tags around matches.",
          },
          wordCount: { type: "integer" },
          rank: { type: "number" },
          contractId: { type: "integer" },
          contractTitle: { type: "string" },
          filingType: { type: "string" },
          filingDate: { type: "string" },
          sourceUrl: { type: "string", description: "Link to the original SEC EDGAR exhibit." },
          filerName: { type: "string" },
          clauseTypeSlug: { type: ["string", "null"] },
          clauseTypeName: { type: ["string", "null"] },
        },
      },
      ClauseDetail: {
        type: "object",
        required: ["id", "text", "contract"],
        properties: {
          id: { type: "integer" },
          heading: { type: ["string", "null"] },
          text: { type: "string", description: "Full clause text." },
          type: { type: ["string", "null"] },
          typeSlug: { type: ["string", "null"] },
          wordCount: { type: "integer" },
          detailUrl: { type: "string" },
          contract: {
            type: "object",
            properties: {
              id: { type: "integer" },
              title: { type: "string" },
              filer: { type: "string" },
              ticker: { type: ["string", "null"] },
              industry: { type: ["string", "null"] },
              filingType: { type: "string" },
              filingDate: { type: "string" },
              counterparty: { type: ["string", "null"] },
              governingLaw: { type: ["string", "null"] },
              sourceUrl: { type: "string" },
            },
          },
        },
      },
      ClauseTypeList: {
        type: "object",
        required: ["types"],
        properties: {
          count: { type: "integer" },
          types: {
            type: "array",
            items: {
              type: "object",
              properties: {
                slug: { type: "string" },
                name: { type: "string" },
                description: { type: ["string", "null"] },
                category: { type: ["string", "null"] },
                clauseCount: { type: "integer" },
              },
            },
          },
        },
      },
      AgreementTypeList: {
        type: "object",
        required: ["agreements"],
        properties: {
          count: { type: "integer" },
          agreements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                slug: { type: "string" },
                name: { type: "string" },
                description: { type: ["string", "null"] },
                category: { type: ["string", "null"] },
                contractCount: { type: "integer" },
                clauseCount: { type: "integer" },
              },
            },
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
