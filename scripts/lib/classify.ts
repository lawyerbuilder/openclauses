// Lightweight clause-type classifier.
//
// Keyword rules over the heading + first ~300 chars of body. Returns the
// best-matching clause-type slug, or null when no rule fires confidently.
// Easy to replace with an LLM call later — see scripts/lib/classify.llm.ts (not yet present).

type Rule = {
  slug: string;
  patterns: RegExp[];
  // optional negative patterns: if any match, skip this rule
  not?: RegExp[];
};

const RULES: Rule[] = [
  {
    slug: "indemnification",
    patterns: [/\bindemnif/i, /hold harmless/i, /defend.*against.*claims/i],
  },
  {
    slug: "limitation-of-liability",
    patterns: [
      /limitation of liability/i,
      /\bno\s+(party|event)\s+shall be liable/i,
      /aggregate liability/i,
      /\bconsequential damages\b/i,
    ],
  },
  {
    slug: "warranties-disclaimer",
    patterns: [/disclaim(?:er)?\s+of\s+warrant/i, /\bas\s+is\b/i, /no\s+other\s+warrant/i],
  },
  {
    slug: "force-majeure",
    patterns: [/force majeure/i, /act of god/i, /events?\s+beyond\s+(its|the)\s+reasonable control/i],
  },
  {
    slug: "termination-for-cause",
    patterns: [/termination\s+for\s+cause/i, /material breach.*terminate/i, /default.*terminate/i],
  },
  {
    slug: "termination-for-convenience",
    patterns: [/termination\s+for\s+convenience/i, /terminate.*without cause/i],
  },
  {
    slug: "term-and-renewal",
    patterns: [/\bterm\s+(of this agreement|and renewal)/i, /automatically renew/i, /renewal term/i],
  },
  {
    slug: "confidentiality",
    patterns: [/confidentiality/i, /confidential information/i, /non[- ]?disclosure/i],
  },
  {
    slug: "ip-ownership",
    patterns: [/intellectual property/i, /\bownership of\b.*work product/i, /background\s+ip/i],
    not: [/license\s+grant/i],
  },
  {
    slug: "license-grant",
    patterns: [/license\s+grant/i, /\bhereby grants?\s+to\b/i, /non-?exclusive.*license/i],
  },
  {
    slug: "non-compete",
    patterns: [/non[- ]?compet/i, /shall not.*engage in.*competing/i, /restrictive covenant/i],
  },
  {
    slug: "non-solicitation",
    patterns: [/non[- ]?solicit/i, /shall not.*solicit\b.*(employee|customer)/i],
  },
  {
    slug: "governing-law",
    patterns: [/governing law/i, /governed by.*laws of/i, /choice of law/i],
  },
  {
    slug: "dispute-resolution",
    patterns: [/dispute resolution/i, /arbitration/i, /mediation/i],
  },
  {
    slug: "jurisdiction-venue",
    patterns: [/jurisdiction\s+and\s+venue/i, /exclusive jurisdiction/i, /submit.*to.*jurisdiction/i],
  },
  {
    slug: "assignment",
    patterns: [/\bassignment\b/i, /may not assign/i, /successors? and assigns?/i],
  },
  {
    slug: "notices",
    patterns: [/^notices?$/i, /all notices.*shall be in writing/i, /given upon.*delivery/i],
  },
  {
    slug: "entire-agreement",
    patterns: [/entire agreement/i, /supersede.*prior/i, /integration clause/i],
  },
  {
    slug: "severability",
    patterns: [/severability/i, /held to be invalid/i, /unenforceable.*remainder/i],
  },
  {
    slug: "waiver",
    patterns: [/\bwaiver\b/i, /no waiver.*shall be effective/i, /failure to enforce/i],
  },
  {
    slug: "amendment",
    patterns: [/^amendment$/i, /no modification.*unless in writing/i, /this agreement may be amended/i],
  },
  {
    slug: "compliance-with-laws",
    patterns: [/compliance with (all )?laws/i, /comply with.*applicable laws/i],
  },
  {
    slug: "anti-corruption",
    patterns: [/anti[- ]?corruption/i, /\bfcpa\b/i, /foreign corrupt practices act/i, /\bbribery\b/i],
  },
  {
    slug: "data-protection",
    patterns: [/data protection/i, /\bgdpr\b/i, /\bccpa\b/i, /personal data/i, /privacy laws?/i],
  },
  {
    slug: "audit-rights",
    patterns: [/audit rights?/i, /right to (audit|inspect)/i, /books and records/i],
  },
  {
    slug: "payment-terms",
    patterns: [/payment terms/i, /shall pay.*invoice/i, /net\s+\d+\s+days/i],
  },
  {
    slug: "insurance",
    patterns: [/^insurance$/i, /maintain.*insurance/i, /commercial general liability/i],
  },
];

export function classifyClause(heading: string | null | undefined, body: string): string | null {
  const corpus = `${heading ?? ""}\n${body.slice(0, 500)}`;
  let best: { slug: string; score: number } | null = null;
  for (const rule of RULES) {
    if (rule.not?.some((re) => re.test(corpus))) continue;
    const score = rule.patterns.reduce((s, re) => s + (re.test(corpus) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { slug: rule.slug, score };
    }
  }
  return best?.slug ?? null;
}
