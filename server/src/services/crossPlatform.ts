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

// Stopwords: common English function words only.
// Keep domain-specific words (election, presidential, republican, etc.) because
// they distinguish WHAT questions are about — removing them causes false positives.
const STOPWORDS = new Set([
  'will', 'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
  'have', 'has', 'had', 'do', 'does', 'did', 'would', 'could', 'should',
  'may', 'might', 'can', 'in', 'on', 'at', 'to', 'for', 'of', 'by',
  'with', 'from', 'or', 'and', 'but', 'if', 'then', 'that', 'this',
  'it', 'its', 'as', 'up', 'than', 'get', 'win', 'before', 'after',
  'any', 'all', 'not', 'no', 'vs', 'who', 'next', 'new', 'first',
  'its', 'their', 'they', 'how', 'when', 'what', 'which', 'more',
]);

// Synonyms: applied BEFORE the length filter so short tokens like "uk" (2 chars)
// get expanded to "united" before being filtered out.
const SYNONYMS: Record<string, string> = {
  buy: 'acquire', purchase: 'acquire',
  us: 'united', usa: 'united', uk: 'united', u: 'united', britain: 'united',
  btc: 'bitcoin', eth: 'ethereum',
  gop: 'republican',
  dem: 'democrat', democratic: 'democrat',
  presidency: 'president', presidential: 'president',
  elect: 'election', elected: 'election',
  invade: 'invasion', invaded: 'invasion',
  ceasefire: 'peace',
  fed: 'federal',
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .map((w) => SYNONYMS[w] ?? w)           // synonyms BEFORE length filter
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

// Words that make a Title-Case phrase a generic concept, NOT a person/team name.
// "Presidential Election", "Champions League", "Nobel Prize" are generic;
// "Elon Musk", "Donald Trump", "Real Madrid" are specific entities.
const GENERIC_NOUN_WORDS = new Set([
  'election', 'presidential', 'president', 'general', 'league', 'cup',
  'championship', 'nomination', 'prize', 'award', 'congress', 'senate',
  'administration', 'government', 'court', 'minister', 'secretary',
  'finals', 'series', 'tournament', 'open', 'party', 'house', 'reserve',
]);

// Extract person/team names from ORIGINAL cased text (skips first word which
// is always capitalized as the start of a sentence, and skips generic phrases).
function extractProperNouns(text: string): Set<string> {
  const result = new Set<string>();
  // Skip the first word (it's always uppercase as sentence start)
  const afterFirstWord = text.replace(/^\S+\s+/, '');
  const matches = afterFirstWord.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g);
  for (const m of matches) {
    const noun = m[1].toLowerCase();
    // Skip if any word in the phrase is a generic concept
    if (noun.split(' ').some((w) => GENERIC_NOUN_WORDS.has(w))) continue;
    result.add(noun);
  }
  return result;
}

// Symmetric overlap — both sides must share sufficient tokens.
// min(scoreA, scoreB) prevents short Kalshi titles from false-matching long Poly questions.
export function questionSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  // Require at least 3 meaningful tokens on both sides (blocks 1-2 word titles)
  if (ta.size < 3 || tb.size < 3) return 0;

  // If both questions name specific entities (people/teams), they must share at least one.
  // "Elon Musk" vs "Donald Trump" → namesA ∩ namesB = ∅ → score 0.
  const namesA = extractProperNouns(a);
  const namesB = extractProperNouns(b);
  if (namesA.size > 0 && namesB.size > 0) {
    const hasCommon = [...namesA].some((n) => namesB.has(n));
    if (!hasCommon) return 0;
  }

  let overlap = 0;
  for (const w of ta) {
    if (tb.has(w)) overlap++;
  }
  return Math.min(overlap / ta.size, overlap / tb.size);
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

  try {
    // Use /events?with_nested_markets=true — /markets endpoint returns 0.0000 prices
    const url = new URL(`${config.kalshiApiUrl}/events`);
    url.searchParams.set('with_nested_markets', 'true');
    url.searchParams.set('limit', '200');

    const res = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PolyScreener/1.0)',
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, 'Kalshi API non-OK');
      return results;
    }

    const raw = await res.json() as Record<string, unknown>;
    const events = (raw.events as { event_ticker?: string; markets?: KalshiMarket[] }[]) ?? [];

    for (const event of events) {
      for (const m of (event.markets ?? [])) {
        const yesPrice = parseKalshiPrice(m);
        if (yesPrice <= 0 || yesPrice >= 1) continue; // skip settled/invalid
        results.push({
          platform: 'Kalshi',
          question: m.title,
          yesPrice,
          url: `https://kalshi.com/markets/${(m.event_ticker ?? event.event_ticker ?? '').toLowerCase()}/${m.ticker.toLowerCase()}`,
        });
      }
    }

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
    if (score < 0.55) continue;

    const diff = Math.abs(polyPrice - ext.yesPrice);
    if (diff < minDiff) continue;

    if (!best || diff > best.diff) {
      best = { ...ext, diff, score };
    }
  }

  return best;
}
