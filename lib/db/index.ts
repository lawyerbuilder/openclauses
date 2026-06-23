import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Provision Neon via Vercel Marketplace and `vercel env pull`.");
}

const sql = neon(url);
export const db = drizzle(sql, { schema });
export { schema };
