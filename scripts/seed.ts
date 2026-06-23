import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";
import { filers, contracts, clauseTypes, clauses } from "../lib/db/schema";

const __dirname = dirname(fileURLToPath(import.meta.url));

type ClauseTypeSeed = {
  slug: string;
  name: string;
  description?: string;
  category?: string;
};

type DemoSeed = Array<{
  filer: { cik: string; name: string; ticker?: string; sicCode?: string; sicIndustry?: string };
  contract: {
    accessionNumber: string;
    exhibitNumber?: string;
    filingType: string;
    filingDate: string;
    title: string;
    sourceUrl: string;
    counterparty?: string;
    governingLaw?: string;
  };
  clauses: Array<{ typeSlug: string; heading: string; text: string }>;
}>;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const sql = neon(url);
  const db = drizzle(sql);

  console.log("→ Seeding clause types…");
  const typesJson = JSON.parse(
    await readFile(join(__dirname, "seed-data", "clause-types.json"), "utf8")
  ) as ClauseTypeSeed[];

  for (const t of typesJson) {
    const existing = await db.select().from(clauseTypes).where(eq(clauseTypes.slug, t.slug));
    if (existing.length === 0) {
      await db.insert(clauseTypes).values({
        slug: t.slug,
        name: t.name,
        description: t.description,
        category: t.category,
      });
    }
  }
  console.log(`  ✓ ${typesJson.length} clause types`);

  console.log("→ Seeding demo clauses…");
  const demo = JSON.parse(
    await readFile(join(__dirname, "seed-data", "demo-clauses.json"), "utf8")
  ) as DemoSeed;

  let totalClauses = 0;
  for (const block of demo) {
    // upsert filer
    let filerRow = (
      await db.select().from(filers).where(eq(filers.cik, block.filer.cik))
    )[0];
    if (!filerRow) {
      [filerRow] = await db
        .insert(filers)
        .values({
          cik: block.filer.cik,
          name: block.filer.name,
          ticker: block.filer.ticker,
          sicCode: block.filer.sicCode,
          sicIndustry: block.filer.sicIndustry,
        })
        .returning();
    }

    // upsert contract
    let contractRow = (
      await db
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.accessionNumber, block.contract.accessionNumber),
            block.contract.exhibitNumber
              ? eq(contracts.exhibitNumber, block.contract.exhibitNumber)
              : eq(contracts.exhibitNumber, "")
          )
        )
    )[0];

    if (!contractRow) {
      [contractRow] = await db
        .insert(contracts)
        .values({
          filerId: filerRow.id,
          accessionNumber: block.contract.accessionNumber,
          exhibitNumber: block.contract.exhibitNumber,
          filingType: block.contract.filingType,
          filingDate: new Date(block.contract.filingDate),
          title: block.contract.title,
          sourceUrl: block.contract.sourceUrl,
          counterparty: block.contract.counterparty,
          governingLaw: block.contract.governingLaw,
        })
        .returning();
    }

    for (let i = 0; i < block.clauses.length; i++) {
      const c = block.clauses[i];
      const type = (
        await db.select().from(clauseTypes).where(eq(clauseTypes.slug, c.typeSlug))
      )[0];

      await db.insert(clauses).values({
        contractId: contractRow.id,
        clauseTypeId: type?.id,
        heading: c.heading,
        text: c.text,
        position: i,
        wordCount: c.text.trim().split(/\s+/).length,
      });
      totalClauses++;
    }
  }
  console.log(`  ✓ ${totalClauses} clauses across ${demo.length} demo contracts`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
