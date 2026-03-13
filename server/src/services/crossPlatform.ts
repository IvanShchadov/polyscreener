import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export interface ExternalMarket {
  platform: string;
  question: string;
  yesPrice: number; // 0-1
  url: string;
}

// Cache
let cachedMarkets: ExternalMarket[] = [];
let lastFetchAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Stopwords to ignore when matching questions
const STOPWORDS = new Set([
  'will', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'would', 'could', 'should',
  'may', 'might', 'can', 'in', 'on', 'at', 'to', 'for', 'of', 'by',
  'with', 'from', 'or', 'and', 'but', 'if', 'then', 'that', 'this',
  'it', 'its', 'as', 'up', 'than', 'get', 'win', 'before', 'after',
  'any', 'all', 'not', 'no', 'vs', 'who',
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

// Overlap coefficient — better than Jaccard for questions of different lengths
export function questionSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const w of ta) {
    if (tb.has(w)) overlap++;
  }
  return overlap / Math.min(ta.size, tb.size);
}

// ─── Kalshi ──────────────────────────────────────────────────────────────────

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  status: string;
  // v2 API returns prices as integer cents (0–100) or string dollars ("0.56")
  yes_bid?: number;
  yes_ask?: number;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  last_price?: number;
  last_price_dollars?: string;
}

interface KalshiResponse {
  markets: KalshiMarket[];
  cursor?: string;
}

function parseKalshiPrice(m: KalshiMarket): number {
  // Try string dollar format first: "0.56" → 0.56
  for (const f of [m.yes_bid_dollars, m.last_price_dollars]) {
    if (f != null) {
      const v = parseFloat(f);
      if (!isNaN(v)) return v > 1 ? v / 100 : v;
    }
  }
  // Fall back to integer cent format: 56 → 0.56
  for (const f of [m.yes_bid, m.last_price]) {
    if (f != null) return f > 1 ? f / 100 : f;
  }
  return 0;
}

async function fetchKalshiMarkets(): Promise<ExternalMarket[]> {
  const results: ExternalMarket[] = [];
  let cursor: string | undefined;
  const batchLimit = 1000;

  try {
    do {
      const url = new URL(`${config.kalshiApiUrl}/markets`);
      url.searchParams.set('status', 'open');
      url.searchParams.set('limit', String(batchLimit));
      if (cursor) url.searchParams.set('cursor', cursor);

      const res = await fetch(url.toString(), {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; PolyScreener/1.0)',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'Kalshi API non-OK');
        break;
      }

      const raw: unknown = await res.json();
      // Handle both { markets: [...] } and { data: [...] } and bare array
      const markets: KalshiMarket[] = Array.isArray(raw)
        ? (raw as KalshiMarket[])
        : ((raw as Record<string, unknown>).markets as KalshiMarket[] | undefined) ??
          ((raw as Record<string, unknown>).data as KalshiMarket[] | undefined) ??
          [];
      const data: KalshiResponse = {
        markets,
        cursor: (raw as Record<string, unknown>).cursor as string | undefined,
      };
      logger.debug({ count: markets.length, firstItem: markets[0] }, 'Kalshi raw response sample');
      for (const m of data.markets) {
        const yesPrice = parseKalshiPrice(m);
        if (yesPrice <= 0 || yesPrice >= 1) continue; // skip settled/invalid
        results.push({
          platform: 'Kalshi',
          question: m.title,
          yesPrice,
          url: `https://kalshi.com/markets/${m.event_ticker.toLowerCase()}/${m.ticker.toLowerCase()}`,
        });
      }

      cursor = data.cursor || undefined;
      // Only fetch one page to avoid rate limiting
      break;
    } while (cursor);

    logger.info({ count: results.length }, 'Fetched Kalshi markets');
  } catch (err) {
    logger.warn({ err }, 'Failed to fetch Kalshi markets');
  }

  return results;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getExternalMarkets(): Promise<ExternalMarket[]> {
  const now = Date.now();
  if (now - lastFetchAt < CACHE_TTL_MS && cachedMarkets.length > 0) {
    return cachedMarkets;
  }

  const markets = await fetchKalshiMarkets();
  // Only update cache timestamp if we got actual data — retry on failure
  if (markets.length > 0) {
    cachedMarkets = markets;
    lastFetchAt = now;
  }
  return cachedMarkets;
}

export function findBestArb(
  polyQuestion: string,
  polyPrice: number,
  externals: ExternalMarket[],
  minDiff: number,
): ExternalMarket & { diff: number; score: number } | null {
  let best: (ExternalMarket & { diff: number; score: number }) | null = null;

  for (const ext of externals) {
    const score = questionSimilarity(polyQuestion, ext.question);
    if (score < 0.5) continue;

    const diff = Math.abs(polyPrice - ext.yesPrice);
    if (diff < minDiff) continue;

    if (!best || diff > best.diff) {
      best = { ...ext, diff, score };
    }
  }

  return best;
}
