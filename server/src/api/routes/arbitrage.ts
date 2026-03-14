import { Router, type Request, type Response } from 'express';
import { getAnomalies } from '../../services/anomaly.js';
import { getExternalMarkets } from '../../services/crossPlatform.js';

const router = Router();

// GET /api/arbitrage — returns cross-platform arb opportunities, deduplicated by Kalshi market
router.get('/arbitrage', (_req: Request, res: Response) => {
  const limit = _req.query.limit ? parseInt(_req.query.limit as string, 10) : 100;
  const anomalies = getAnomalies({ type: 'CROSS_PLATFORM_ARB', limit: limit * 3 });

  // Deduplicate: if multiple Polymarket questions matched the same Kalshi market,
  // keep only the one with the largest price gap.
  const seenKalshi = new Map<string, typeof anomalies[0]>();
  for (const a of anomalies) {
    const key = String(a.metadata.kalshiUrl ?? a.metadata.kalshiQuestion ?? a.id);
    const existing = seenKalshi.get(key);
    if (!existing || Number(a.metadata.diffCents) > Number(existing.metadata.diffCents)) {
      seenKalshi.set(key, a);
    }
  }

  const deduped = [...seenKalshi.values()]
    .sort((a, b) => Number(b.metadata.diffCents) - Number(a.metadata.diffCents))
    .slice(0, limit);

  res.json(deduped);
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
