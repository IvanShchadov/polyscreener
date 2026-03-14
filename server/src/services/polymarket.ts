import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import type { MarketSnapshot, GammaMarket, GammaEvent } from '../types/index.js';

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
    const arr = Array.isArray(raw) ? raw : JSON.parse(String(raw));
    if (Array.isArray(arr) && arr.length >= 2) {
      return [parseFloat(arr[0]) || 0, parseFloat(arr[1]) || 0];
    }
    if (Array.isArray(arr) && arr.length === 1) {
      const yes = parseFloat(arr[0]) || 0;
      return [yes, yes > 0 ? Math.round((1 - yes) * 100) / 100 : 0];
    }
    return [0, 0];
  } catch {
    return [0, 0];
  }
}

function toSnapshot(m: GammaMarket, tags: string[], eventSlug: string): MarketSnapshot {
  const [yes, no] = parseOutcomePrices(m.outcomePrices);
  return {
    conditionId: m.conditionId,
    question: m.question,
    slug: m.slug,
    eventSlug,
    volume: m.volumeNum ?? (typeof m.volume === 'number' ? m.volume : parseFloat(m.volume) || 0),
    liquidity: m.liquidityNum ?? (typeof m.liquidity === 'number' ? m.liquidity : parseFloat(m.liquidity) || 0),
    outcomeYes: yes,
    outcomeNo: no,
    spread: m.spread ?? 0,
    bestBid: m.bestBid ?? 0,
    bestAsk: m.bestAsk ?? 0,
    tags,
    active: m.active,
    closed: m.closed,
    clobTokenIds: parseJsonArray(m.clobTokenIds),
    fetchedAt: Date.now(),
  };
}

export async function fetchTopMarketSnapshots(
  n: number,
): Promise<MarketSnapshot[]> {
  const allSnapshots: MarketSnapshot[] = [];
  const batchSize = 50;
  let offset = 0;

  // Use Events API — it includes proper tags (slugs) and markets with clobTokenIds
  while (allSnapshots.length < n * 2) {
    const url = new URL('/events', config.gammaApiUrl);
    url.searchParams.set('active', 'true');
    url.searchParams.set('closed', 'false');
    url.searchParams.set('order', 'volume');
    url.searchParams.set('ascending', 'false');
    url.searchParams.set('limit', String(batchSize));
    url.searchParams.set('offset', String(offset));

    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        logger.warn({ status: res.status, offset }, 'Gamma Events API non-OK');
        break;
      }
      const events: GammaEvent[] = await res.json();
      if (events.length === 0) break;

      for (const event of events) {
        const tags = (event.tags ?? []).map((t) => t.slug);
        const slug = event.slug;

        for (const market of (event.markets ?? [])) {
          if (!market.active || market.closed) continue;
          if (!market.conditionId) continue;
          allSnapshots.push(toSnapshot(market, tags, slug));
        }
      }

      offset += batchSize;
      // Stop when we've fetched enough events
      if (offset >= 300) break;
    } catch (err) {
      logger.error({ err, offset }, 'Gamma Events API fetch failed');
      break;
    }
  }

  // Sort by volume desc, dedupe by conditionId, take top n
  const seen = new Set<string>();
  const deduped = allSnapshots
    .sort((a, b) => b.volume - a.volume)
    .filter((s) => {
      if (seen.has(s.conditionId)) return false;
      seen.add(s.conditionId);
      return true;
    });

  const result = deduped.slice(0, n);
  logger.info({ count: result.length, eventsScanned: offset }, 'Fetched market snapshots via Events API');
  return result;
}

export async function fetchMidpoint(tokenId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${config.clobApiUrl}/midpoint?token_id=${tokenId}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const mid = parseFloat(data.mid);
    return isNaN(mid) ? null : mid;
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
