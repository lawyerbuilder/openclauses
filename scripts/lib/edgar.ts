// Minimal SEC EDGAR client used by the ingestion script.
//
// EDGAR rules of the road we honor here:
//   - Every request includes a descriptive User-Agent (see EDGAR_USER_AGENT).
//   - We throttle to ~8 req/s (SEC's published cap is 10).
//   - We hit data.sec.gov for JSON and www.sec.gov for filing HTML.

const DEFAULT_DELAY_MS = Number(process.env.EDGAR_REQUEST_DELAY_MS ?? 125);

let lastRequestAt = 0;

async function throttledFetch(url: string, init?: RequestInit): Promise<Response> {
  const ua = process.env.EDGAR_USER_AGENT;
  if (!ua) {
    throw new Error(
      "EDGAR_USER_AGENT must be set (format: \"Your Name email@example.com\")."
    );
  }
  const now = Date.now();
  const wait = Math.max(0, lastRequestAt + DEFAULT_DELAY_MS - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();

  const headers = new Headers(init?.headers);
  headers.set("User-Agent", ua);
  headers.set("Accept-Encoding", "gzip, deflate");
  headers.set("Host", new URL(url).host);
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    throw new Error(`EDGAR ${res.status} ${res.statusText} for ${url}`);
  }
  return res;
}

export type EdgarHit = {
  accessionNumber: string; // 0000000000-00-000000
  cik: string; // zero-padded
  filerName: string;
  filingType: string;
  filingDate: string; // YYYY-MM-DD
  filename: string; // exhibit filename
};

/**
 * Query EDGAR full-text search for exhibits that look like material contracts.
 * Returns the underlying filing identifiers we need to fetch the exhibit HTML.
 */
export async function searchMaterialContractExhibits(opts: {
  forms?: string[];
  query?: string;
  limit?: number;
}): Promise<EdgarHit[]> {
  const forms = opts.forms ?? ["10-K", "10-Q", "8-K"];
  const q = opts.query ?? "\"material contract\"";
  const limit = Math.min(opts.limit ?? 25, 100);

  const params = new URLSearchParams({
    q,
    forms: forms.join(","),
  });
  const url = `https://efts.sec.gov/LATEST/search-index?${params.toString()}&from=0&size=${limit}`;
  const res = await throttledFetch(url);
  const data = (await res.json()) as {
    hits: {
      hits: Array<{
        _id: string;
        _source: {
          ciks: string[];
          display_names: string[];
          form: string;
          file_date: string;
          adsh: string;
        };
      }>;
    };
  };

  return data.hits.hits.map((h) => {
    // _id is e.g. "0001234567-24-000010:exhibit10-1.htm"
    const [accessionWithDashes, filename] = h._id.split(":");
    return {
      accessionNumber: accessionWithDashes,
      cik: h._source.ciks[0],
      filerName: h._source.display_names[0]?.split(/\s+\(CIK/)[0] ?? "",
      filingType: h._source.form,
      filingDate: h._source.file_date,
      filename: filename ?? "",
    };
  });
}

/**
 * Build the canonical archive URL for a filing.
 * EDGAR stores archives at /Archives/edgar/data/{CIK no leading zeros}/{accession no dashes}/{filename}
 */
export function buildExhibitUrl(hit: EdgarHit): string {
  const cikNum = String(Number(hit.cik));
  const accessionNoDashes = hit.accessionNumber.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${cikNum}/${accessionNoDashes}/${hit.filename}`;
}

export async function fetchExhibitText(hit: EdgarHit): Promise<string> {
  const res = await throttledFetch(buildExhibitUrl(hit));
  return await res.text();
}

export type FilerInfo = {
  cik: string;
  name: string;
  ticker?: string;
  sicCode?: string;
  sicIndustry?: string;
};

const filerCache = new Map<string, FilerInfo>();

export async function getFilerInfo(cik: string): Promise<FilerInfo> {
  if (filerCache.has(cik)) return filerCache.get(cik)!;
  const padded = cik.padStart(10, "0");
  const res = await throttledFetch(`https://data.sec.gov/submissions/CIK${padded}.json`);
  const data = (await res.json()) as {
    name: string;
    tickers?: string[];
    sic?: string;
    sicDescription?: string;
  };
  const info: FilerInfo = {
    cik: padded,
    name: data.name,
    ticker: data.tickers?.[0],
    sicCode: data.sic,
    sicIndustry: data.sicDescription,
  };
  filerCache.set(cik, info);
  return info;
}
