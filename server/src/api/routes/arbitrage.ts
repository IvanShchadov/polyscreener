import { Router, type Request, type Response } from 'express';
import { getAnomalies } from '../../services/anomaly.js';
import { getExternalMarkets } from '../../services/crossPlatform.js';

const router = Router();

// GET /api/arbitrage — returns cross-platform arb opportunities, deduplicated
router.get('/arbitrage', (_req: Request, res: Response) => {
  const limit = _req.query.limit ? parseInt(_req.query.limit as string, 10) : 100;
  // Fetch generously — we'll deduplicate down
  const anomalies = getAnomalies({ type: 'CROSS_PLATFORM_ARB', limit: 1000 });

  // Sort newest first so we keep the most recent entry when deduplicating
  anomalies.sort((a, b) => b.detectedAt - a.detectedAt);

  // Pass 1: one entry per Polymarket conditionId (drops repeated scan copies)
  const byCondition = new Map<string, typeof anomalies[0]>();
  for (const a of anomalies) {
    if (!byCondition.has(a.conditionId)) byCondition.set(a.conditionId, a);
  }

  // Pass 2: one entry per Kalshi market (keep highest gap when multiple Poly questions match same Kalshi)
  const byKalshi = new Map<string, typeof anomalies[0]>();
  for (const a of byCondition.values()) {
    const key = String(a.metadata.kalshiUrl ?? a.metadata.kalshiQuestion ?? a.conditionId);
    const existing = byKalshi.get(key);
    if (!existing || Number(a.metadata.diffCents) > Number(existing.metadata.diffCents)) {
      byKalshi.set(key, a);
    }
  }

  const result = [...byKalshi.values()]
    .sort((a, b) => Number(b.metadata.diffCents) - Number(a.metadata.diffCents))
    .slice(0, limit);

  res.json(result);
});

// GET /api/arbitrage/kalshi — returns raw Kalshi market data for debugging
router.get('/arbitrage/kalshi', async (_req: Request, res: Response) => {
  try {
    const markets = await getExternalMarkets();
    res.json({ count: markets.length, markets: markets.slice(0, 50) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
