import { Router, type Request, type Response } from 'express';
import { logger } from '../../utils/logger.js';

const router = Router();

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/i;
const DATA_API = 'https://data-api.polymarket.com';

interface PortfolioPosition {
  conditionId: string;
  question: string;
  outcome: string;
  size: number;
  avgPrice: number;
  currentPrice: number;
  currentValue: number;
  invested: number;
  pnl: number;
  pnlPct: number;
  eventSlug: string;
}

interface TradeActivity {
  id: string;
  timestamp: number;
  question: string;
  outcome: string;
  side: string;
  price: number;
  size: number;
  value: number;
  transactionHash: string;
  eventSlug: string;
}

interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnl: number;
  totalPnlPct: number;
  openPositions: number;
  totalShares: number;
  potentialWinnings: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePosition(raw: Record<string, any>): PortfolioPosition {
  const size = Number(raw.size ?? raw.rawSize ?? 0);
  const avgPrice = Number(raw.avgPrice ?? raw.avgCost ?? 0);
  const currentValue = Number(raw.currentValue ?? 0);
  const currentPrice =
    Number(raw.pricePerShare ?? raw.currentPrice ?? 0) ||
    (size > 0 ? currentValue / size : 0);
  const invested = size * avgPrice;
  const pnl =
    raw.pnl !== undefined
      ? Number(raw.pnl)
      : raw.cashPnl !== undefined
        ? Number(raw.cashPnl)
        : raw.totalPnl !== undefined
          ? Number(raw.totalPnl)
          : currentValue - invested;
  const pnlPct = invested !== 0 ? (pnl / invested) * 100 : 0;

  return {
    conditionId: String(raw.conditionId ?? raw.id ?? ''),
    question: String(raw.title ?? raw.question ?? ''),
    outcome: String(raw.outcome ?? ''),
    size,
    avgPrice,
    currentPrice,
    currentValue,
    invested,
    pnl,
    pnlPct,
    eventSlug: String(raw.eventSlug ?? raw.slug ?? ''),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTrade(raw: Record<string, any>): TradeActivity {
  const size = Number(raw.size ?? raw.shares ?? 0);
  const rawSide = String(raw.side ?? raw.type ?? '');
  const side =
    rawSide.toLowerCase() === 'sell'
      ? 'SELL'
      : rawSide.toLowerCase() === 'buy'
        ? 'BUY'
        : rawSide.toUpperCase();

  // price: prefer explicit price field, fall back to usdcSize/size
  const usdcSize = Number(raw.usdcSize ?? raw.amount ?? 0);
  const price = Number(raw.price ?? (size > 0 ? usdcSize / size : 0));
  const value = price * size;

  // timestamp: prefer ms epoch; createdAt may be ISO or seconds
  let timestamp = Number(raw.timestamp ?? 0);
  if (!timestamp && raw.createdAt) {
    const parsed = typeof raw.createdAt === 'string'
      ? Date.parse(raw.createdAt)
      : Number(raw.createdAt) * 1000;
    timestamp = parsed;
  }

  return {
    id: String(raw.id ?? raw.transactionHash ?? raw.hash ?? ''),
    timestamp,
    question: String(raw.title ?? raw.question ?? ''),
    outcome: String(raw.outcome ?? ''),
    side,
    price,
    size,
    value,
    transactionHash: String(raw.transactionHash ?? raw.hash ?? ''),
    eventSlug: String(raw.eventSlug ?? raw.slug ?? ''),
  };
}

async function fetchSafe<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; PolyScreener/1.0)',
      },
    });
    if (!res.ok) {
      logger.error({ url, status: res.status }, 'Data API non-OK response');
      return [];
    }
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as T[]) : [];
  } catch (err) {
    logger.error({ err, url }, 'Data API fetch error');
    return [];
  }
}

router.get('/portfolio/:address', async (req: Request, res: Response) => {
  const address = req.params['address'] as string;

  if (!ADDRESS_RE.test(address)) {
    res.status(400).json({ error: 'Invalid Ethereum address' });
    return;
  }

  const [rawPositions, rawActivity] = await Promise.all([
    fetchSafe<Record<string, unknown>>(
      `${DATA_API}/positions?user=${address}&sizeThreshold=0`,
    ),
    fetchSafe<Record<string, unknown>>(
      `${DATA_API}/activity?user=${address}&limit=100&offset=0`,
    ),
  ]);

  const positions: PortfolioPosition[] = rawPositions.map((p) =>
    normalizePosition(p as Record<string, unknown>),
  );

  const activity: TradeActivity[] = rawActivity.map((a) =>
    normalizeTrade(a as Record<string, unknown>),
  );

  const totalInvested = positions.reduce((s, p) => s + p.invested, 0);
  const totalCurrentValue = positions.reduce((s, p) => s + p.currentValue, 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalPnlPct =
    totalInvested !== 0 ? (totalPnl / totalInvested) * 100 : 0;

  const totalShares = positions.reduce((s, p) => s + p.size, 0);

  const summary: PortfolioSummary = {
    totalInvested,
    totalCurrentValue,
    totalPnl,
    totalPnlPct,
    openPositions: positions.length,
    totalShares,
    potentialWinnings: totalShares - totalCurrentValue,
  };

  res.json({ address, positions, activity, summary });
});

export default router;
