-- Initial schema for OpenClauses. Applied by `npm run db:push` or `npm run db:migrate`.

CREATE TABLE IF NOT EXISTS "filers" (
  "id" serial PRIMARY KEY,
  "cik" varchar(16) NOT NULL,
  "name" text NOT NULL,
  "ticker" varchar(16),
  "sic_code" varchar(8),
  "sic_industry" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "filers_cik_idx" ON "filers" ("cik");
CREATE INDEX IF NOT EXISTS "filers_name_idx" ON "filers" ("name");

CREATE TABLE IF NOT EXISTS "contracts" (
  "id" serial PRIMARY KEY,
  "filer_id" integer NOT NULL REFERENCES "filers"("id") ON DELETE CASCADE,
  "accession_number" varchar(32) NOT NULL,
  "exhibit_number" varchar(16),
  "filing_type" varchar(16) NOT NULL,
  "filing_date" timestamp NOT NULL,
  "title" text NOT NULL,
  "source_url" text NOT NULL,
  "counterparty" text,
  "governing_law" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "contracts_accession_exhibit_idx"
  ON "contracts" ("accession_number", "exhibit_number");
CREATE INDEX IF NOT EXISTS "contracts_filer_idx" ON "contracts" ("filer_id");
CREATE INDEX IF NOT EXISTS "contracts_filing_date_idx" ON "contracts" ("filing_date");

CREATE TABLE IF NOT EXISTS "clause_types" (
  "id" serial PRIMARY KEY,
  "slug" varchar(64) NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "category" varchar(64)
);
CREATE UNIQUE INDEX IF NOT EXISTS "clause_types_slug_idx" ON "clause_types" ("slug");

CREATE TABLE IF NOT EXISTS "clauses" (
  "id" serial PRIMARY KEY,
  "contract_id" integer NOT NULL REFERENCES "contracts"("id") ON DELETE CASCADE,
  "clause_type_id" integer REFERENCES "clause_types"("id") ON DELETE SET NULL,
  "heading" text,
  "text" text NOT NULL,
  "position" integer NOT NULL DEFAULT 0,
  "word_count" integer NOT NULL DEFAULT 0,
  "search_vector" tsvector
    GENERATED ALWAYS AS (to_tsvector('english', coalesce("heading", '') || ' ' || "text")) STORED,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "clauses_search_idx" ON "clauses" USING gin ("search_vector");
CREATE INDEX IF NOT EXISTS "clauses_contract_idx" ON "clauses" ("contract_id");
CREATE INDEX IF NOT EXISTS "clauses_type_idx" ON "clauses" ("clause_type_id");
