import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import type { MarketSnapshot, GammaMarket } from '../types/index.js';

function parseJsonArray(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseOutcomePrices(raw: unknown): [number, number] {
  if (!raw) return [0, 0];
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(arr) && arr.length >= 2) {
      return [parseFloat(arr[0]) || 0, parseFloat(arr[1]) || 0];
    }
    if (Array.isArray(arr) && arr.length === 1) {
      const yes = parseFloat(arr[0]) || 0;
      return [yes, yes > 0 ? 1 - yes : 0];
    }
    return [0, 0];
  } catch {
    return [0, 0];
  }
}

function toSnapshot(m: GammaMarket): MarketSnapshot {
  const [yes, no] = parseOutcomePrices(m.outcome_prices);
  return {
    conditionId: m.condition_id,
    question: m.question,
    slug: m.slug,
    volume: m.volume_num ?? (parseFloat(m.volume) || 0),
    liquidity: m.liquidity_num ?? (parseFloat(m.liquidity) || 0),
    outcomeYes: yes,
    outcomeNo: no,
    spread: m.spread ?? 0,
    bestBid: m.best_bid ?? 0,
    bestAsk: m.best_ask ?? 0,
    tags: (m.tags || []).map((t) => (typeof t === 'string' ? t : t.label)),
    active: m.active,
    closed: m.closed,
    clobTokenIds: parseJsonArray(m.clob_token_ids),
    fetchedAt: Date.now(),
  };
}

export async function fetchTopMarketSnapshots(
  n: number,
): Promise<MarketSnapshot[]> {
  const snapshots: MarketSnapshot[] = [];
  const batchSize = 100;

  for (let offset = 0; offset < n; offset += batchSize) {
    const limit = Math.min(batchSize, n - offset);
    const url = new URL('/markets', config.gammaApiUrl);
    url.searchParams.set('active', 'true');
    url.searchParams.set('closed', 'false');
    url.searchParams.set('archived', 'false');
    url.searchParams.set('order', 'volume');
    url.searchParams.set('ascending', 'false');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String(offset));

    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        logger.warn({ status: res.status, offset }, 'Gamma API non-OK');
        break;
      }
      const markets: GammaMarket[] = await res.json();
      if (markets.length === 0) break;
      snapshots.push(...markets.map(toSnapshot));
    } catch (err) {
      logger.error({ err, offset }, 'Gamma API fetch failed');
      break;
    }
  }

  logger.info({ count: snapshots.length }, 'Fetched market snapshots');
  return snapshots;
}

export async function fetchMidpoint(tokenId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${config.clobApiUrl}/midpoint?token_id=${tokenId}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return parseFloat(data.mid) || null;
  } catch {
    return null;
  }
}

export async function fetchOrderBook(
  tokenId: string,
): Promise<{ bids: { price: string; size: string }[]; asks: { price: string; size: string }[] } | null> {
  try {
    const res = await fetch(
      `${config.clobApiUrl}/book?token_id=${tokenId}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
