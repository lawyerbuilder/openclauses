// vercel.ts — typed Vercel project configuration.
// Drop-in for vercel.json. Requires the @vercel/config package once installed.
// See https://vercel.com/docs/project-configuration/vercel-ts
//
// Note: keep this commented import until @vercel/config resolves at install time on Vercel.
// import { routes, type VercelConfig } from "@vercel/config/v1";

const config = {
  framework: "nextjs",
  buildCommand: "next build",
  crons: [
    // Nightly EDGAR ingest. Vercel will hit this route on Pro+ plans.
    { path: "/api/ingest/edgar", schedule: "0 7 * * *" },
  ],
};

export default config;
