import { db } from "./db";
import { sql } from "drizzle-orm";

export type ClauseHit = {
  id: number;
  heading: string | null;
  text: string;
  wordCount: number;
  rank: number;
  contractId: number;
  contractTitle: string;
  filingType: string;
  filingDate: string;
  sourceUrl: string;
  filerId: number;
  filerName: string;
  clauseTypeSlug: string | null;
  clauseTypeName: string | null;
};

export async function searchClauses(opts: {
  query: string;
  typeSlug?: string;
  limit?: number;
  offset?: number;
}): Promise<ClauseHit[]> {
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const q = opts.query.trim();
  if (!q) return [];

  const rows = await db.execute(sql`
    select
      clauses.id,
      clauses.heading,
      ts_headline(
        'english',
        clauses.text,
        websearch_to_tsquery('english', ${q}),
        'StartSel=<mark>,StopSel=</mark>,MaxFragments=2,MinWords=20,MaxWords=60'
      ) as text,
      clauses.word_count as "wordCount",
      ts_rank(clauses.search_vector, websearch_to_tsquery('english', ${q})) as rank,
      contracts.id as "contractId",
      contracts.title as "contractTitle",
      contracts.filing_type as "filingType",
      contracts.filing_date as "filingDate",
      contracts.source_url as "sourceUrl",
      filers.id as "filerId",
      filers.name as "filerName",
      clause_types.slug as "clauseTypeSlug",
      clause_types.name as "clauseTypeName"
    from clauses
    join contracts on contracts.id = clauses.contract_id
    join filers on filers.id = contracts.filer_id
    left join clause_types on clause_types.id = clauses.clause_type_id
    where clauses.search_vector @@ websearch_to_tsquery('english', ${q})
      ${opts.typeSlug ? sql`and clause_types.slug = ${opts.typeSlug}` : sql``}
    order by rank desc, clauses.id desc
    limit ${limit} offset ${offset}
  `);

  return rows.rows as unknown as ClauseHit[];
}

export async function countClauses(opts: { query: string; typeSlug?: string }) {
  const q = opts.query.trim();
  if (!q) return 0;
  const result = await db.execute(sql`
    select count(*)::int as count
    from clauses
    left join clause_types on clause_types.id = clauses.clause_type_id
    where clauses.search_vector @@ websearch_to_tsquery('english', ${q})
      ${opts.typeSlug ? sql`and clause_types.slug = ${opts.typeSlug}` : sql``}
  `);
  return (result.rows[0] as { count: number }).count;
}

export type ClauseDetail = {
  id: number;
  heading: string | null;
  text: string;
  wordCount: number;
  contractId: number;
  contractTitle: string;
  filingType: string;
  filingDate: string;
  sourceUrl: string;
  counterparty: string | null;
  governingLaw: string | null;
  filerId: number;
  filerName: string;
  ticker: string | null;
  sicIndustry: string | null;
  clauseTypeId: number | null;
  clauseTypeSlug: string | null;
  clauseTypeName: string | null;
};

export async function getClauseById(id: number): Promise<ClauseDetail | null> {
  const result = await db.execute(sql`
    select
      clauses.id,
      clauses.heading,
      clauses.text,
      clauses.word_count as "wordCount",
      clauses.clause_type_id as "clauseTypeId",
      contracts.id as "contractId",
      contracts.title as "contractTitle",
      contracts.filing_type as "filingType",
      contracts.filing_date as "filingDate",
      contracts.source_url as "sourceUrl",
      contracts.counterparty,
      contracts.governing_law as "governingLaw",
      filers.id as "filerId",
      filers.name as "filerName",
      filers.ticker,
      filers.sic_industry as "sicIndustry",
      clause_types.slug as "clauseTypeSlug",
      clause_types.name as "clauseTypeName"
    from clauses
    join contracts on contracts.id = clauses.contract_id
    join filers on filers.id = contracts.filer_id
    left join clause_types on clause_types.id = clauses.clause_type_id
    where clauses.id = ${id}
    limit 1
  `);
  return (result.rows[0] ?? null) as ClauseDetail | null;
}

export async function getRelatedClauses(clauseTypeId: number | null, excludeId: number, limit = 6) {
  if (clauseTypeId == null) return [];
  const result = await db.execute(sql`
    select
      clauses.id,
      clauses.heading,
      substring(clauses.text, 1, 400) as text,
      filers.name as "filerName",
      contracts.title as "contractTitle"
    from clauses
    join contracts on contracts.id = clauses.contract_id
    join filers on filers.id = contracts.filer_id
    where clauses.clause_type_id = ${clauseTypeId}
      and clauses.id <> ${excludeId}
    order by random()
    limit ${limit}
  `);
  return result.rows as Array<{
    id: number;
    heading: string | null;
    text: string;
    filerName: string;
    contractTitle: string;
  }>;
}

export async function getCorpusStats() {
  const result = await db.execute(sql`
    select
      (select count(*)::int from clauses) as "totalClauses",
      (select count(*)::int from clauses where clause_type_id is not null) as "classifiedClauses",
      (select count(*)::int from contracts) as "totalContracts",
      (select count(*)::int from filers) as "totalFilers"
  `);
  return result.rows[0] as {
    totalClauses: number;
    classifiedClauses: number;
    totalContracts: number;
    totalFilers: number;
  };
}

export async function listClauseTypes() {
  const result = await db.execute(sql`
    select
      clause_types.id,
      clause_types.slug,
      clause_types.name,
      clause_types.description,
      clause_types.category,
      count(clauses.id)::int as "clauseCount"
    from clause_types
    left join clauses on clauses.clause_type_id = clause_types.id
    group by clause_types.id
    order by "clauseCount" desc, clause_types.name asc
  `);
  return result.rows as Array<{
    id: number;
    slug: string;
    name: string;
    description: string | null;
    category: string | null;
    clauseCount: number;
  }>;
}

export async function listAgreementTypeCounts() {
  const result = await db.execute(sql`
    select
      contracts.agreement_type as slug,
      count(distinct contracts.id)::int as "contractCount",
      count(clauses.id)::int as "clauseCount"
    from contracts
    left join clauses on clauses.contract_id = contracts.id
    where contracts.agreement_type is not null
    group by contracts.agreement_type
    order by "contractCount" desc
  `);
  return result.rows as Array<{ slug: string; contractCount: number; clauseCount: number }>;
}

export async function listContractsByAgreementType(opts: {
  slug?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = opts.limit ?? 30;
  const offset = opts.offset ?? 0;
  const result = await db.execute(sql`
    select
      contracts.id,
      contracts.title,
      contracts.filing_type as "filingType",
      contracts.filing_date as "filingDate",
      contracts.source_url as "sourceUrl",
      contracts.agreement_type as "agreementType",
      filers.id as "filerId",
      filers.name as "filerName",
      filers.ticker,
      filers.sic_industry as "sicIndustry",
      (select count(*)::int from clauses where contract_id = contracts.id) as "clauseCount"
    from contracts
    join filers on filers.id = contracts.filer_id
    ${opts.slug ? sql`where contracts.agreement_type = ${opts.slug}` : sql``}
    order by contracts.filing_date desc, contracts.id desc
    limit ${limit} offset ${offset}
  `);
  return result.rows as Array<{
    id: number;
    title: string;
    filingType: string;
    filingDate: string;
    sourceUrl: string;
    agreementType: string | null;
    filerId: number;
    filerName: string;
    ticker: string | null;
    sicIndustry: string | null;
    clauseCount: number;
  }>;
}

export async function countContractsByAgreementType(slug?: string) {
  const result = await db.execute(sql`
    select count(*)::int as count
    from contracts
    ${slug ? sql`where agreement_type = ${slug}` : sql``}
  `);
  return (result.rows[0] as { count: number }).count;
}

export type ContractDetail = {
  id: number;
  title: string;
  filingType: string;
  filingDate: string;
  sourceUrl: string;
  accessionNumber: string;
  exhibitNumber: string | null;
  counterparty: string | null;
  governingLaw: string | null;
  agreementType: string | null;
  filerId: number;
  filerName: string;
  ticker: string | null;
  sicIndustry: string | null;
};

export async function getContractById(id: number): Promise<ContractDetail | null> {
  const result = await db.execute(sql`
    select
      contracts.id,
      contracts.title,
      contracts.filing_type as "filingType",
      contracts.filing_date as "filingDate",
      contracts.source_url as "sourceUrl",
      contracts.accession_number as "accessionNumber",
      contracts.exhibit_number as "exhibitNumber",
      contracts.counterparty,
      contracts.governing_law as "governingLaw",
      contracts.agreement_type as "agreementType",
      filers.id as "filerId",
      filers.name as "filerName",
      filers.ticker,
      filers.sic_industry as "sicIndustry"
    from contracts
    join filers on filers.id = contracts.filer_id
    where contracts.id = ${id}
    limit 1
  `);
  return (result.rows[0] ?? null) as ContractDetail | null;
}

export async function getClausesForContract(contractId: number) {
  const result = await db.execute(sql`
    select
      clauses.id,
      clauses.heading,
      clauses.text,
      clauses.position,
      clauses.word_count as "wordCount",
      clause_types.slug as "clauseTypeSlug",
      clause_types.name as "clauseTypeName"
    from clauses
    left join clause_types on clause_types.id = clauses.clause_type_id
    where clauses.contract_id = ${contractId}
    order by clauses.position asc, clauses.id asc
  `);
  return result.rows as Array<{
    id: number;
    heading: string | null;
    text: string;
    position: number;
    wordCount: number;
    clauseTypeSlug: string | null;
    clauseTypeName: string | null;
  }>;
}

export async function listRecentClauses(limit = 8) {
  const result = await db.execute(sql`
    select
      clauses.id,
      clauses.heading,
      substring(clauses.text, 1, 280) as text,
      filers.name as "filerName",
      contracts.title as "contractTitle",
      clause_types.slug as "clauseTypeSlug",
      clause_types.name as "clauseTypeName"
    from clauses
    join contracts on contracts.id = clauses.contract_id
    join filers on filers.id = contracts.filer_id
    left join clause_types on clause_types.id = clauses.clause_type_id
    order by clauses.id desc
    limit ${limit}
  `);
  return result.rows as Array<{
    id: number;
    heading: string | null;
    text: string;
    filerName: string;
    contractTitle: string;
    clauseTypeSlug: string | null;
    clauseTypeName: string | null;
  }>;
}
