import crypto from 'node:crypto';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import type {
  Anomaly,
  AnomalyType,
  Severity,
  MarketSnapshot,
  PricePoint,
  PriceHistory,
  AnomalyStats,
} from '../types/index.js';
import type { ExternalMarket } from './crossPlatform.js';
import { findBestArb } from './crossPlatform.js';

const ANOMALY_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const DEDUP_WINDOW_MS = ANOMALY_TTL_MS; // same as TTL — one entry per market per cycle
const MAX_PRICE_POINTS = 200;

// In-memory stores
const anomalies = new Map<string, Anomaly>();
const priceHistories = new Map<string, PricePoint[]>();
const volumeAverages = new Map<string, { sum: number; count: number; prevVolume: number }>();
const prevSnapshots = new Map<string, MarketSnapshot>();
const dedupKeys = new Map<string, number>(); // key → timestamp

function makeDedupKey(type: AnomalyType, conditionId: string): string {
  return `${type}:${conditionId}`;
}

function isDuplicate(type: AnomalyType, conditionId: string): boolean {
  const key = makeDedupKey(type, conditionId);
  const last = dedupKeys.get(key);
  if (last && Date.now() - last < DEDUP_WINDOW_MS) return true;
  dedupKeys.set(key, Date.now());
  return false;
}

function createAnomaly(
  type: AnomalyType,
  severity: Severity,
  snapshot: MarketSnapshot,
  description: string,
  metadata: Record<string, string | number>,
): Anomaly {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    type,
    severity,
    conditionId: snapshot.conditionId,
    question: snapshot.question,
    slug: snapshot.slug,
    eventSlug: snapshot.eventSlug,
    description,
    metadata,
    detectedAt: now,
    expiresAt: now + ANOMALY_TTL_MS,
  };
}

function priceSeverity(delta: number): Severity {
  const abs = Math.abs(delta);
  if (abs >= 0.20) return 'CRITICAL';
  if (abs >= 0.12) return 'HIGH';
  if (abs >= 0.07) return 'MEDIUM';
  return 'LOW';
}

function whaleSeverity(size: number): Severity {
  if (size >= 50_000) return 'CRITICAL';
  if (size >= 20_000) return 'HIGH';
  if (size >= 10_000) return 'MEDIUM';
  return 'LOW';
}

function detectPriceSpike(snapshot: MarketSnapshot): Anomaly | null {
  const prev = prevSnapshots.get(snapshot.conditionId);
  if (!prev) return null;

  const delta = snapshot.outcomeYes - prev.outcomeYes;
  if (Math.abs(delta) < config.priceChangeThreshold) return null;
  if (isDuplicate('PRICE_SPIKE', snapshot.conditionId)) return null;

  const direction = delta > 0 ? 'up' : 'down';
  const pct = (Math.abs(delta) * 100).toFixed(1);

  return createAnomaly(
    'PRICE_SPIKE',
    priceSeverity(delta),
    snapshot,
    `YES price moved ${direction} ${pct}% (${(prev.outcomeYes * 100).toFixed(0)}¢ → ${(snapshot.outcomeYes * 100).toFixed(0)}¢)`,
    {
      prevPrice: Math.round(prev.outcomeYes * 100),
      currentPrice: Math.round(snapshot.outcomeYes * 100),
      changePercent: parseFloat(pct),
      direction,
    },
  );
}

function detectVolumeSurge(snapshot: MarketSnapshot): Anomaly | null {
  const avg = volumeAverages.get(snapshot.conditionId);
  if (!avg || avg.count < 3) return null;

  const delta = snapshot.volume - avg.prevVolume;
  if (delta <= 0) return null;

  const meanDelta = avg.sum / avg.count;
  if (meanDelta === 0) return null;
  if (delta <= meanDelta * config.volumeSpikeMultiplier) return null;
  if (isDuplicate('VOLUME_SURGE', snapshot.conditionId)) return null;

  const ratio = (delta / meanDelta).toFixed(1);

  return createAnomaly(
    'VOLUME_SURGE',
    'MEDIUM',
    snapshot,
    `Volume surge: +$${formatNum(delta)} this scan (${ratio}x above avg +$${formatNum(meanDelta)})`,
    {
      volume: Math.round(delta),
      avgVolume: Math.round(meanDelta),
      multiplier: parseFloat(ratio),
    },
  );
}

function detectSpreadAnomaly(snapshot: MarketSnapshot): Anomaly | null {
  if (snapshot.spread <= 0.10) return null;
  if (isDuplicate('SPREAD_ANOMALY', snapshot.conditionId)) return null;

  const spreadCents = (snapshot.spread * 100).toFixed(0);
  const severity: Severity = snapshot.spread > 0.20 ? 'HIGH' : 'MEDIUM';

  return createAnomaly(
    'SPREAD_ANOMALY',
    severity,
    snapshot,
    `Wide spread detected: ${spreadCents}¢ (bid: ${(snapshot.bestBid * 100).toFixed(0)}¢, ask: ${(snapshot.bestAsk * 100).toFixed(0)}¢)`,
    {
      spread: parseFloat(spreadCents),
      bestBid: Math.round(snapshot.bestBid * 100),
      bestAsk: Math.round(snapshot.bestAsk * 100),
    },
  );
}

function detectNewMarketHot(snapshot: MarketSnapshot): Anomaly | null {
  const prev = prevSnapshots.get(snapshot.conditionId);
  if (prev) return null; // not new

  if (snapshot.volume <= 50_000 || snapshot.liquidity <= 10_000) return null;
  if (isDuplicate('NEW_MARKET_HOT', snapshot.conditionId)) return null;

  return createAnomaly(
    'NEW_MARKET_HOT',
    'LOW',
    snapshot,
    `New hot market: $${formatNum(snapshot.volume)} volume, $${formatNum(snapshot.liquidity)} liquidity`,
    {
      volume: Math.round(snapshot.volume),
      liquidity: Math.round(snapshot.liquidity),
    },
  );
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
}

export function detectAnomalies(snapshots: MarketSnapshot[]): Anomaly[] {
  const found: Anomaly[] = [];

  for (const snap of snapshots) {
    const spike = detectPriceSpike(snap);
    if (spike) found.push(spike);

    const surge = detectVolumeSurge(snap);
    if (surge) found.push(surge);

    const spread = detectSpreadAnomaly(snap);
    if (spread) found.push(spread);

    const hot = detectNewMarketHot(snap);
    if (hot) found.push(hot);

    // Update stores
    updatePriceHistory(snap);
    updateVolumeAverage(snap);
    prevSnapshots.set(snap.conditionId, snap);
  }

  // Store new anomalies
  for (const a of found) {
    anomalies.set(a.id, a);
  }

  // Prune expired
  pruneExpired();

  if (found.length > 0) {
    logger.info({ count: found.length }, 'Anomalies detected');
  }

  return found;
}

export function addWhaleAnomaly(
  conditionId: string,
  size: number,
  price: number,
  side: string,
): Anomaly | null {
  if (size < config.whaleTradeMinSize) return null;
  if (isDuplicate('WHALE_TRADE', conditionId)) return null;

  const snapshot = prevSnapshots.get(conditionId);
  if (!snapshot) return null;

  const anomaly = createAnomaly(
    'WHALE_TRADE',
    whaleSeverity(size),
    snapshot,
    `Whale ${side} detected: $${formatNum(size)} at ${(price * 100).toFixed(0)}¢`,
    {
      tradeSize: Math.round(size),
      price: Math.round(price * 100),
      side,
    },
  );

  anomalies.set(anomaly.id, anomaly);
  return anomaly;
}

export function detectCrossPlatformArbs(
  snapshots: MarketSnapshot[],
  externalMarkets: ExternalMarket[],
): Anomaly[] {
  if (externalMarkets.length === 0) return [];
  const found: Anomaly[] = [];

  for (const snap of snapshots) {
    const arb = findBestArb(snap.question, snap.outcomeYes, externalMarkets, config.arbDiffThreshold);
    if (!arb) continue;
    if (isDuplicate('CROSS_PLATFORM_ARB', snap.conditionId)) continue;

    const diff = arb.diff;
    const severity: Severity = diff >= 0.15 ? 'HIGH' : diff >= 0.10 ? 'MEDIUM' : 'LOW';
    const polyPct = (snap.outcomeYes * 100).toFixed(0);
    const extPct = (arb.yesPrice * 100).toFixed(0);
    const direction = snap.outcomeYes > arb.yesPrice ? 'higher' : 'lower';

    const anomaly = createAnomaly(
      'CROSS_PLATFORM_ARB',
      severity,
      snap,
      `Poly ${polyPct}¢ vs ${arb.platform} ${extPct}¢ — Poly is ${direction} by ${(diff * 100).toFixed(0)}¢`,
      {
        polyPrice: Math.round(snap.outcomeYes * 100),
        extPrice: Math.round(arb.yesPrice * 100),
        diffCents: Math.round(diff * 100),
        platform: arb.platform,
        kalshiUrl: arb.url,
        kalshiQuestion: arb.question,
      },
    );

    anomalies.set(anomaly.id, anomaly);
    found.push(anomaly);
  }

  return found;
}

function updatePriceHistory(snap: MarketSnapshot): void {
  let points = priceHistories.get(snap.conditionId);
  if (!points) {
    points = [];
    priceHistories.set(snap.conditionId, points);
  }
  points.push({ timestamp: snap.fetchedAt, yes: snap.outcomeYes, no: snap.outcomeNo });
  if (points.length > MAX_PRICE_POINTS) {
    points.splice(0, points.length - MAX_PRICE_POINTS);
  }
}

function updateVolumeAverage(snap: MarketSnapshot): void {
  const avg = volumeAverages.get(snap.conditionId);
  if (!avg) {
    volumeAverages.set(snap.conditionId, { sum: 0, count: 0, prevVolume: snap.volume });
    return;
  }
  const delta = snap.volume - avg.prevVolume;
  if (delta > 0) {
    avg.sum += delta;
    avg.count += 1;
  }
  avg.prevVolume = snap.volume;
  volumeAverages.set(snap.conditionId, avg);
}

function pruneExpired(): void {
  const now = Date.now();
  for (const [id, a] of anomalies) {
    if (a.expiresAt < now) anomalies.delete(id);
  }
  for (const [key, ts] of dedupKeys) {
    if (now - ts > DEDUP_WINDOW_MS) dedupKeys.delete(key);
  }
}

export function pruneStaleMarkets(activeConditionIds: Set<string>): void {
  for (const id of priceHistories.keys()) {
    if (!activeConditionIds.has(id)) priceHistories.delete(id);
  }
  for (const id of volumeAverages.keys()) {
    if (!activeConditionIds.has(id)) volumeAverages.delete(id);
  }
  for (const id of prevSnapshots.keys()) {
    if (!activeConditionIds.has(id)) prevSnapshots.delete(id);
  }
}

export function getAnomalies(filters?: {
  type?: AnomalyType;
  severity?: Severity;
  limit?: number;
}): Anomaly[] {
  let result = Array.from(anomalies.values());

  if (filters?.type) {
    result = result.filter((a) => a.type === filters.type);
  }
  if (filters?.severity) {
    result = result.filter((a) => a.severity === filters.severity);
  }

  result.sort((a, b) => b.detectedAt - a.detectedAt);

  if (filters?.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

export function getAnomalyStats(): AnomalyStats {
  const now = Date.now();
  const all = Array.from(anomalies.values());

  const byType = {
    PRICE_SPIKE: 0,
    VOLUME_SURGE: 0,
    SPREAD_ANOMALY: 0,
    WHALE_TRADE: 0,
    CROSS_PLATFORM_ARB: 0,
    NEW_MARKET_HOT: 0,
  };
  const bySeverity = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  let last1h = 0;
  let last24h = 0;

  for (const a of all) {
    byType[a.type]++;
    bySeverity[a.severity]++;
    if (now - a.detectedAt < 3_600_000) last1h++;
    if (now - a.detectedAt < 86_400_000) last24h++;
  }

  return { total: all.length, last1h, last24h, byType, bySeverity };
}

export function getPriceHistory(conditionId: string): PriceHistory | null {
  const points = priceHistories.get(conditionId);
  if (!points) return null;
  return { conditionId, points: [...points] };
}

export function getTrackedMarkets(): MarketSnapshot[] {
  return Array.from(prevSnapshots.values());
}

export function getTrackedMarket(conditionId: string): MarketSnapshot | null {
  return prevSnapshots.get(conditionId) || null;
}
