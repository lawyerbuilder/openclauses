-- Add agreement_type slug column to contracts. Lets us browse by agreement
-- category (supply, credit, license, merger, etc.) — the same 30 categories
-- the bulk ingest already uses as query strategies.

ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "agreement_type" varchar(64);
CREATE INDEX IF NOT EXISTS "contracts_agreement_type_idx" ON "contracts" ("agreement_type");
