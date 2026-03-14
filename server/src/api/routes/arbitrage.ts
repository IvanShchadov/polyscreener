import { Router, type Request, type Response } from 'express';
import { getAnomalies } from '../../services/anomaly.js';
import { getExternalMarkets } from '../../services/crossPlatform.js';

const router = Router();

// GET /api/arbitrage — returns cross-platform arb opportunities
router.get('/arbitrage', (_req: Request, res: Response) => {
  const limit = _req.query.limit ? parseInt(_req.query.limit as string, 10) : 100;
  const anomalies = getAnomalies({ type: 'CROSS_PLATFORM_ARB', limit });
  res.json(anomalies);
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
