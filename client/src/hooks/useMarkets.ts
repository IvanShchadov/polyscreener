import { useState, useEffect } from 'react';
import type { MarketSnapshot } from '../types';
import { fetchMarkets } from '../lib/api';

export function useMarkets() {
  const [markets, setMarkets] = useState<MarketSnapshot[]>([]);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const data = await fetchMarkets({ limit: 10, sort: 'volume' });
        if (active && data.markets) setMarkets(data.markets);
      } catch {
        // ignore
      }
    }

    poll();
    const id = setInterval(poll, 10_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  return { markets };
}
