import { useState } from 'react';
import type { PortfolioData, PortfolioPosition } from '../types';
import { fetchPortfolio } from '../lib/api';

function aggregatePortfolios(datasets: PortfolioData[]): PortfolioData {
  if (datasets.length === 1) return datasets[0];

  // Merge positions by conditionId+outcome — sum sizes, weighted avg price
  const posMap = new Map<string, PortfolioPosition>();
  for (const d of datasets) {
    for (const p of d.positions) {
      const key = `${p.conditionId}|${p.outcome}`;
      const ex = posMap.get(key);
      if (!ex) {
        posMap.set(key, { ...p });
      } else {
        const totalSize = ex.size + p.size;
        const avgPrice = totalSize > 0
          ? (ex.size * ex.avgPrice + p.size * p.avgPrice) / totalSize
          : 0;
        const invested = ex.invested + p.invested;
        const currentValue = ex.currentValue + p.currentValue;
        const pnl = ex.pnl + p.pnl;
        posMap.set(key, {
          ...ex,
          size: totalSize,
          avgPrice,
          invested,
          currentValue,
          pnl,
          pnlPct: invested !== 0 ? (pnl / invested) * 100 : 0,
        });
      }
    }
  }

  const positions = Array.from(posMap.values());

  // Merge activity: concat, dedupe by id, sort newest first, cap at 200
  const seenIds = new Set<string>();
  const activity = datasets
    .flatMap((d) => d.activity)
    .filter((t) => {
      if (seenIds.has(t.id)) return false;
      seenIds.add(t.id);
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 200);

  const totalInvested = positions.reduce((s, p) => s + p.invested, 0);
  const totalCurrentValue = positions.reduce((s, p) => s + p.currentValue, 0);
  const totalPnl = totalCurrentValue - totalInvested;
  const totalShares = positions.reduce((s, p) => s + p.size, 0);

  return {
    address: datasets.map((d) => d.address).join(', '),
    positions,
    activity,
    summary: {
      totalInvested,
      totalCurrentValue,
      totalPnl,
      totalPnlPct: totalInvested !== 0 ? (totalPnl / totalInvested) * 100 : 0,
      openPositions: positions.length,
      totalShares,
      potentialWinnings: totalShares - totalCurrentValue,
    },
  };
}

export function usePortfolio() {
  const [address, setAddress] = useState('');
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(addrs: string[]) {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(addrs.map((a) => fetchPortfolio(a)));
      setData(aggregatePortfolios(results));
    } catch {
      setError('Failed to load portfolio. Check the address(es) and try again.');
    } finally {
      setLoading(false);
    }
  }

  return { address, setAddress, data, loading, error, load };
}
