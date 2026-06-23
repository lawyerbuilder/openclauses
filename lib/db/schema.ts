import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// NOTE: `clauses.search_vector` (tsvector, generated column) lives in the DB
// but is NOT declared here — Drizzle's `db:push` doesn't model generated
// columns, and we only ever read the column through raw SQL in lib/search.ts.
// The column + GIN index are created by drizzle/0000_init.sql.

export const filers = pgTable(
  "filers",
  {
    id: serial("id").primaryKey(),
    cik: varchar("cik", { length: 16 }).notNull(),
    name: text("name").notNull(),
    ticker: varchar("ticker", { length: 16 }),
    sicCode: varchar("sic_code", { length: 8 }),
    sicIndustry: text("sic_industry"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    cikIdx: uniqueIndex("filers_cik_idx").on(t.cik),
    nameIdx: index("filers_name_idx").on(t.name),
  })
);

export const contracts = pgTable(
  "contracts",
  {
    id: serial("id").primaryKey(),
    filerId: integer("filer_id")
      .notNull()
      .references(() => filers.id, { onDelete: "cascade" }),
    accessionNumber: varchar("accession_number", { length: 32 }).notNull(),
    exhibitNumber: varchar("exhibit_number", { length: 16 }),
    filingType: varchar("filing_type", { length: 16 }).notNull(),
    filingDate: timestamp("filing_date", { withTimezone: false }).notNull(),
    title: text("title").notNull(),
    sourceUrl: text("source_url").notNull(),
    counterparty: text("counterparty"),
    governingLaw: text("governing_law"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    accessionExhibitIdx: uniqueIndex("contracts_accession_exhibit_idx").on(
      t.accessionNumber,
      t.exhibitNumber
    ),
    filerIdx: index("contracts_filer_idx").on(t.filerId),
    filingDateIdx: index("contracts_filing_date_idx").on(t.filingDate),
  })
);

export const clauseTypes = pgTable(
  "clause_types",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: varchar("category", { length: 64 }),
  },
  (t) => ({
    slugIdx: uniqueIndex("clause_types_slug_idx").on(t.slug),
  })
);

export const clauses = pgTable(
  "clauses",
  {
    id: serial("id").primaryKey(),
    contractId: integer("contract_id")
      .notNull()
      .references(() => contracts.id, { onDelete: "cascade" }),
    clauseTypeId: integer("clause_type_id").references(() => clauseTypes.id, {
      onDelete: "set null",
    }),
    heading: text("heading"),
    text: text("text").notNull(),
    position: integer("position").notNull().default(0),
    wordCount: integer("word_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    contractIdx: index("clauses_contract_idx").on(t.contractId),
    typeIdx: index("clauses_type_idx").on(t.clauseTypeId),
  })
);

export type Filer = typeof filers.$inferSelect;
export type Contract = typeof contracts.$inferSelect;
export type ClauseType = typeof clauseTypes.$inferSelect;
export type Clause = typeof clauses.$inferSelect;
