// LLM-based clause-type classifier.
//
// Uses the AI SDK with a Vercel AI Gateway model id ("provider/model"). On Vercel
// this works automatically via OIDC; locally you need AI_GATEWAY_API_KEY set.
// We default to Groq's Llama 3.3 70B — fast and free-tier-friendly for batch jobs.
//
// Returns null if the model can't pick a confident type or if AI_GATEWAY isn't
// configured — caller should fall back to keyword classification.

import { generateObject } from "ai";
import { z } from "zod";

const DEFAULT_MODEL =
  process.env.OPENCLAUSES_CLASSIFIER_MODEL ?? "groq/llama-3.3-70b-versatile";

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

/**
 * Build an LLM classifier bound to a closed taxonomy of clause-type slugs.
 * Returns null synchronously if no AI credentials are present — caller can
 * use this to decide whether to wire the LLM path at all.
 */
export function makeLlmClassifier(slugs: string[]): LlmClassifier | null {
  const hasGateway =
    !!process.env.AI_GATEWAY_API_KEY ||
    !!process.env.VERCEL_OIDC_TOKEN ||
    process.env.VERCEL === "1";
  if (!hasGateway) return null;

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
        model: DEFAULT_MODEL,
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
