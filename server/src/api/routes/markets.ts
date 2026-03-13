import { Router, type Request, type Response } from 'express';
import { getTrackedMarkets, getTrackedMarket, getPriceHistory, getAnomalies } from '../../services/anomaly.js';
import { getScannerStatus } from '../../services/scanner.js';

const router = Router();

router.get('/markets', (req: Request, res: Response) => {
  const q = (req.query.q as string || '').toLowerCase();
  const tag = (req.query.tag as string || '').toLowerCase();
  const sort = (req.query.sort as string) || 'volume';
  const limit = parseInt((req.query.limit as string) || '50', 10);
  const offset = parseInt((req.query.offset as string) || '0', 10);

  let markets = getTrackedMarkets();

  if (q) {
    markets = markets.filter((m) => m.question.toLowerCase().includes(q));
  }
  if (tag) {
    markets = markets.filter((m) => m.tags.some((t) => t.toLowerCase() === tag));
  }

  if (sort === 'volume') {
    markets.sort((a, b) => b.volume - a.volume);
  } else if (sort === 'liquidity') {
    markets.sort((a, b) => b.liquidity - a.liquidity);
  }

  const total = markets.length;
  markets = markets.slice(offset, offset + limit);

  res.json({ total, markets });
});

router.get('/markets/scanner/status', (_req: Request, res: Response) => {
  res.json(getScannerStatus());
});

router.get('/markets/:conditionId/prices', (req: Request, res: Response) => {
  const conditionId = req.params.conditionId as string;
  const history = getPriceHistory(conditionId);
  if (!history) {
    res.json({ conditionId, points: [] });
    return;
  }
  res.json(history);
});

router.get('/markets/:conditionId/anomalies', (req: Request, res: Response) => {
  const conditionId = req.params.conditionId as string;
  const all = getAnomalies({ limit: 200 });
  res.json(all.filter((a) => a.conditionId === conditionId));
});

router.get('/markets/:conditionId', (req: Request, res: Response) => {
  const conditionId = req.params.conditionId as string;
  const market = getTrackedMarket(conditionId);
  if (!market) {
    res.status(404).json({ error: 'Market not found' });
    return;
  }
  res.json(market);
});

export default router;
