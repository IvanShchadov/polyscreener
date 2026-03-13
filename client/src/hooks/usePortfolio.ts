import { useState } from 'react';
import type { PortfolioData } from '../types';
import { fetchPortfolio } from '../lib/api';

export function usePortfolio() {
  const [address, setAddress] = useState('');
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(addr: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPortfolio(addr);
      setData(result);
    } catch {
      setError('Failed to load portfolio. Check the address and try again.');
    } finally {
      setLoading(false);
    }
  }

  return { address, setAddress, data, loading, error, load };
}
