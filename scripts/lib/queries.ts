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
  { id: "release",          name: "Release Agreement",         category: "Dispute",    description: "Mutual and one-way releases of legal claims, often paired with settlements.",                                     query: `"release agreement"`,                   forms: ["10-K", "10-Q", "8-K"] },
  { id: "tolling",          name: "Tolling Agreement",         category: "Dispute",    description: "Agreements that pause statutes of limitations during settlement negotiations.",                                   query: `"tolling agreement"`,                   forms: ["10-K", "10-Q", "8-K"] },

  // Additional commercial / operating
  { id: "framework",        name: "Framework Agreement",       category: "Commercial", description: "Umbrella commercial frameworks under which transactional documents are issued.",                                  query: `"framework agreement"`,                 forms: ["10-K", "10-Q", "8-K"] },
  { id: "outsourcing",      name: "Outsourcing Agreement",     category: "Commercial", description: "Business-process or IT outsourcing arrangements.",                                                                 query: `"outsourcing agreement"`,               forms: ["10-K", "10-Q", "8-K"] },
  { id: "agency",           name: "Agency Agreement",          category: "Commercial", description: "Sales-agency, marketing-agency, and similar principal-agent arrangements.",                                        query: `"agency agreement"`,                    forms: ["10-K", "10-Q", "8-K"] },
  { id: "sla",              name: "Service Level Agreement",   category: "Commercial", description: "Performance SLAs covering uptime, response time, and remedies.",                                                   query: `"service level agreement"`,             forms: ["10-K", "10-Q", "8-K"] },
  { id: "operating",        name: "Operating Agreement",       category: "Commercial", description: "LLC operating agreements governing internal economics and governance.",                                            query: `"operating agreement"`,                 forms: ["10-K", "10-Q", "8-K"] },
  { id: "rd-agreement",     name: "R&D Agreement",             category: "Commercial", description: "Joint or sponsored research and development agreements.",                                                          query: `"research and development agreement"`,  forms: ["10-K", "10-Q", "8-K"] },

  // Additional financing
  { id: "underwriting",     name: "Underwriting Agreement",    category: "Financing",  description: "Underwriting agreements for public equity and debt offerings.",                                                    query: `"underwriting agreement"`,              forms: ["8-K", "10-Q"] },
  { id: "placement",        name: "Placement Agency Agreement", category: "Financing", description: "Best-efforts placement agent engagements for private and registered placements.",                                  query: `"placement agency agreement"`,          forms: ["8-K", "10-Q"] },
  { id: "intercreditor",    name: "Intercreditor Agreement",   category: "Financing",  description: "Inter-lender priority, payment, and enforcement agreements.",                                                      query: `"intercreditor agreement"`,             forms: ["10-K", "10-Q", "8-K"] },
  { id: "subordination",    name: "Subordination Agreement",   category: "Financing",  description: "Debt subordination and standby creditor agreements.",                                                              query: `"subordination agreement"`,             forms: ["10-K", "10-Q", "8-K"] },
  { id: "pledge",           name: "Pledge Agreement",          category: "Financing",  description: "Equity, intellectual property, or other asset pledges securing obligations.",                                      query: `"pledge agreement"`,                    forms: ["10-K", "10-Q", "8-K"] },
  { id: "isda",             name: "ISDA Master Agreement",     category: "Financing",  description: "ISDA master agreements governing OTC derivatives between counterparties.",                                         query: `"isda master agreement"`,               forms: ["10-K", "10-Q", "8-K"] },

  // Additional corporate / M&A
  { id: "tax-matters",      name: "Tax Matters Agreement",     category: "Corporate",  description: "Tax sharing, indemnification, and procedural agreements between affiliated entities.",                              query: `"tax matters agreement"`,               forms: ["8-K", "10-Q"] },
  { id: "tax-sharing",      name: "Tax Sharing Agreement",     category: "Corporate",  description: "Inter-affiliate tax allocation agreements, common in spin-offs.",                                                   query: `"tax sharing agreement"`,               forms: ["8-K", "10-Q"] },
  { id: "earn-out",         name: "Earn-Out Agreement",        category: "Corporate",  description: "Earn-out and contingent-consideration arrangements in M&A.",                                                       query: `"earn-out agreement"`,                  forms: ["8-K", "10-Q"] },
  { id: "lock-up",          name: "Lock-Up Agreement",         category: "Corporate",  description: "Insider lock-ups limiting share sales after IPOs and other transactions.",                                        query: `"lock-up agreement"`,                   forms: ["8-K", "10-Q"] },
  { id: "investor-rights",  name: "Investor Rights Agreement", category: "Corporate",  description: "Preferred-investor rights — information, board, preemptive, registration.",                                       query: `"investor rights agreement"`,           forms: ["8-K", "10-Q"] },
  { id: "side-letter",      name: "Side Letter",               category: "Corporate",  description: "Side letters granting bespoke rights or amending standard documents.",                                            query: `"side letter"`,                         forms: ["10-K", "10-Q", "8-K"] },

  // Additional employment / equity comp
  { id: "change-in-control", name: "Change-in-Control Agreement", category: "Employment", description: "Severance and acceleration agreements triggered by change-in-control events.",                               query: `"change in control agreement"`,         forms: ["10-K", "8-K"] },
  { id: "stock-option",     name: "Stock Option Agreement",    category: "Employment", description: "Individual option grants and award agreements.",                                                                 query: `"stock option agreement"`,              forms: ["10-K", "8-K"] },
  { id: "restricted-stock", name: "Restricted Stock Agreement", category: "Employment", description: "RSU and restricted stock award agreements.",                                                                    query: `"restricted stock agreement"`,          forms: ["10-K", "8-K"] },

  // Additional IP
  { id: "patent-license",   name: "Patent License Agreement",  category: "IP & Confidentiality", description: "Patent license, cross-license, and patent-pool agreements.",                                          query: `"patent license agreement"`,            forms: ["10-K", "10-Q", "8-K"] },
];

export const QUERY_BY_SLUG = new Map(QUERIES.map((q) => [q.id, q]));

/** Lightweight version safe to import into client components (no EDGAR query). */
export const AGREEMENT_TYPES = QUERIES.map(({ id, name, description, category }) => ({
  slug: id,
  name,
  description,
  category,
}));
