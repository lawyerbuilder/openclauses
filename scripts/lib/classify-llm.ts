// LLM-based clause-type classifier.
//
// Two backends, picked in priority order:
//   1. Direct Groq (set GROQ_API_KEY) — free tier at console.groq.com, no card.
//   2. Vercel AI Gateway (set AI_GATEWAY_API_KEY or run on Vercel itself) —
//      unified billing, observability, fallbacks.
//
// Returns null if neither is configured — caller falls back to keyword rules.

import { generateObject } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";

const MODEL_ID =
  process.env.OPENCLAUSES_CLASSIFIER_MODEL ?? "llama-3.3-70b-versatile";

let cachedSchema: z.ZodObject<{ slug: z.ZodEnum<[string, ...string[]]>; confidence: z.ZodNumber }> | null = null;

function buildSchema(slugs: string[]) {
  if (cachedSchema) return cachedSchema;
  cachedSchema = z.object({
    slug: z.enum(slugs as [string, ...string[]]),
    confidence: z.number().min(0).max(1),
  });
  return cachedSchema;
}

export type LlmClassifier = (
  heading: string | null | undefined,
  body: string
) => Promise<string | null>;

export function makeLlmClassifier(slugs: string[]): LlmClassifier | null {
  const groqKey = process.env.GROQ_API_KEY;
  const hasGateway =
    !!process.env.AI_GATEWAY_API_KEY ||
    !!process.env.VERCEL_OIDC_TOKEN ||
    process.env.VERCEL === "1";

  if (!groqKey && !hasGateway) return null;

  // Direct Groq wins when both are present — it's the cheaper path.
  const model = groqKey
    ? createGroq({ apiKey: groqKey })(MODEL_ID)
    : (`groq/${MODEL_ID}` as const);

  const schema = buildSchema(slugs);

  return async (heading, body) => {
    const prompt = [
      "Classify the following contract clause into exactly one of the slugs in the schema.",
      "Return your best guess and a 0–1 confidence. If none of the slugs fit well, pick the closest and use a low confidence.",
      "",
      `HEADING: ${heading?.trim() || "(none)"}`,
      "",
      "CLAUSE BODY:",
      body.slice(0, 2000),
    ].join("\n");

    try {
      const { object } = await generateObject({
        model,
        schema,
        prompt,
      });
      return object.confidence >= 0.45 ? object.slug : null;
    } catch (err) {
      console.warn(`  ⚠ LLM classify failed: ${(err as Error).message}`);
      return null;
    }
  };
}

/** Reports which backend would be used. Useful for the ingestion run banner. */
export function describeLlmBackend(): string {
  if (process.env.GROQ_API_KEY) return "Groq (direct, console.groq.com)";
  if (
    process.env.AI_GATEWAY_API_KEY ||
    process.env.VERCEL_OIDC_TOKEN ||
    process.env.VERCEL === "1"
  ) {
    return "Groq via Vercel AI Gateway";
  }
  return "disabled";
}
