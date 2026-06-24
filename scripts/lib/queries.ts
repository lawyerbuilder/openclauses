// EDGAR query strategies for bulk ingestion AND the canonical taxonomy of
// agreement types shown in the /agreements browse UI. Single source of truth
// for slug → display name → search phrase.

export type QueryStrategy = {
  /** Stable slug used as agreement_type on contracts. */
  id: string;
  /** Display name shown in UI. */
  name: string;
  /** Short description shown on category pages. */
  description?: string;
  /** Category grouping for the /agreements landing page. */
  category: "Commercial" | "Financing" | "Corporate" | "Employment" | "IP & Confidentiality" | "Dispute";
  /** EDGAR full-text search phrase (quoted = exact match). */
  query: string;
  /** EDGAR filing forms to search across. */
  forms: string[];
  maxPages?: number;
};

export const QUERIES: QueryStrategy[] = [
  // Commercial / operating contracts
  { id: "supply",           name: "Supply Agreement",          category: "Commercial", description: "Agreements where one party supplies goods or services to another on recurring terms.",                       query: `"supply agreement"`,                    forms: ["10-K", "10-Q", "8-K"] },
  { id: "distribution",     name: "Distribution Agreement",    category: "Commercial", description: "Agreements appointing a distributor for products in a territory.",                                                query: `"distribution agreement"`,              forms: ["10-K", "10-Q", "8-K"] },
  { id: "manufacturing",    name: "Manufacturing Agreement",   category: "Commercial", description: "Contract manufacturing or toll-manufacturing arrangements.",                                                       query: `"manufacturing agreement"`,             forms: ["10-K", "10-Q", "8-K"] },
  { id: "license",          name: "License Agreement",         category: "Commercial", description: "Grants of rights to use intellectual property, technology, or content.",                                          query: `"license agreement"`,                   forms: ["10-K", "10-Q", "8-K"] },
  { id: "services-msa",     name: "Master Services Agreement", category: "Commercial", description: "Umbrella services contracts under which specific work orders or SOWs are issued.",                                query: `"master services agreement"`,           forms: ["10-K", "10-Q", "8-K"] },
  { id: "services",         name: "Services Agreement",        category: "Commercial", description: "General service-provision contracts not structured as MSAs.",                                                     query: `"services agreement"`,                  forms: ["10-K", "10-Q", "8-K"] },
  { id: "lease",            name: "Lease Agreement",           category: "Commercial", description: "Real-property or equipment leases.",                                                                              query: `"lease agreement"`,                     forms: ["10-K", "10-Q", "8-K"] },
  { id: "consulting",       name: "Consulting Agreement",      category: "Commercial", description: "Engagements of individual or firm consultants.",                                                                  query: `"consulting agreement"`,                forms: ["10-K", "10-Q", "8-K"] },

  // Financing
  { id: "credit",           name: "Credit Agreement",          category: "Financing",  description: "Senior debt facilities — revolvers, term loans, and bridge financings.",                                          query: `"credit agreement"`,                    forms: ["10-K", "10-Q", "8-K"] },
  { id: "loan",             name: "Loan Agreement",            category: "Financing",  description: "Bilateral or small-syndicate loan facilities outside the credit-agreement form.",                                  query: `"loan agreement"`,                      forms: ["10-K", "10-Q", "8-K"] },
  { id: "security",         name: "Security Agreement",        category: "Financing",  description: "Collateral grants securing payment or performance obligations.",                                                  query: `"security agreement"`,                  forms: ["10-K", "10-Q", "8-K"] },
  { id: "indenture",        name: "Indenture",                 category: "Financing",  description: "Bond and note indentures with a trustee.",                                                                        query: `"indenture"`,                           forms: ["10-K", "8-K"] },
  { id: "guaranty",         name: "Guaranty Agreement",        category: "Financing",  description: "Guarantees of payment or performance by a parent, affiliate, or third party.",                                    query: `"guaranty agreement"`,                  forms: ["10-K", "10-Q", "8-K"] },
  { id: "warrant",          name: "Warrant Agreement",         category: "Financing",  description: "Warrants and warrant-related agreements issued alongside equity or debt financings.",                              query: `"warrant agreement"`,                   forms: ["10-K", "8-K"] },

  // Corporate / M&A / equity
  { id: "merger",           name: "Merger Agreement",          category: "Corporate",  description: "Definitive merger and combination agreements.",                                                                   query: `"merger agreement"`,                    forms: ["8-K", "10-Q"] },
  { id: "stock-purchase",   name: "Stock Purchase Agreement",  category: "Corporate",  description: "Agreements for the purchase and sale of equity.",                                                                 query: `"stock purchase agreement"`,            forms: ["8-K", "10-Q"] },
  { id: "asset-purchase",   name: "Asset Purchase Agreement",  category: "Corporate",  description: "Agreements for the purchase and sale of assets out of an entity.",                                                query: `"asset purchase agreement"`,            forms: ["8-K", "10-Q"] },
  { id: "subscription",     name: "Subscription Agreement",    category: "Corporate",  description: "Investor subscriptions for newly-issued equity or debt.",                                                          query: `"subscription agreement"`,              forms: ["8-K", "10-Q"] },
  { id: "registration",     name: "Registration Rights Agreement", category: "Corporate", description: "Investor rights to demand or piggyback registration of securities.",                                          query: `"registration rights agreement"`,       forms: ["8-K", "10-Q"] },
  { id: "voting",           name: "Voting Agreement",          category: "Corporate",  description: "Stockholder voting commitments, often in support of a transaction.",                                              query: `"voting agreement"`,                    forms: ["8-K", "10-Q"] },
  { id: "shareholders",     name: "Shareholders Agreement",    category: "Corporate",  description: "Inter-stockholder rights, transfer restrictions, and governance terms.",                                          query: `"shareholders agreement"`,              forms: ["10-K", "8-K"] },
  { id: "joint-venture",    name: "Joint Venture Agreement",   category: "Corporate",  description: "JV and combination operating agreements.",                                                                       query: `"joint venture agreement"`,             forms: ["10-K", "10-Q", "8-K"] },

  // Employment / executive
  { id: "employment",       name: "Employment Agreement",      category: "Employment", description: "Executive and other individual employment contracts.",                                                            query: `"employment agreement"`,                forms: ["10-K", "8-K"] },
  { id: "separation",       name: "Separation Agreement",      category: "Employment", description: "Separation, severance, and transition agreements with departing executives.",                                    query: `"separation agreement"`,                forms: ["10-K", "8-K"] },
  { id: "non-compete-agmt", name: "Non-Competition Agreement", category: "Employment", description: "Standalone restrictive-covenant agreements.",                                                                    query: `"non-competition agreement"`,           forms: ["10-K", "8-K"] },
  { id: "transition-svcs",  name: "Transition Services Agreement", category: "Employment", description: "Post-closing services arrangements, often associated with M&A or executive departures.",                    query: `"transition services agreement"`,       forms: ["10-K", "8-K"] },

  // IP and confidentiality
  { id: "nda",              name: "Non-Disclosure Agreement",  category: "IP & Confidentiality", description: "Mutual and one-way confidentiality agreements.",                                                       query: `"non-disclosure agreement"`,            forms: ["10-K", "10-Q", "8-K"] },
  { id: "ip-assignment",    name: "IP Assignment Agreement",   category: "IP & Confidentiality", description: "Assignments of patents, copyrights, trademarks, or invention rights.",                                 query: `"intellectual property assignment"`,    forms: ["10-K", "8-K"] },

  // Dispute / settlement
  { id: "settlement",       name: "Settlement Agreement",      category: "Dispute",    description: "Settlement and release agreements resolving disputes.",                                                            query: `"settlement agreement"`,                forms: ["10-K", "10-Q", "8-K"] },
  { id: "indemnification",  name: "Indemnification Agreement", category: "Dispute",    description: "Standalone indemnification agreements with officers, directors, or counterparties.",                              query: `"indemnification agreement"`,           forms: ["10-K", "8-K"] },
];

export const QUERY_BY_SLUG = new Map(QUERIES.map((q) => [q.id, q]));

/** Lightweight version safe to import into client components (no EDGAR query). */
export const AGREEMENT_TYPES = QUERIES.map(({ id, name, description, category }) => ({
  slug: id,
  name,
  description,
  category,
}));
