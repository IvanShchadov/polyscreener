import { useState, useEffect } from 'react';
import type { AnomalyStats, ScannerStatus } from '../types';
import { fetchAnomalyStats, fetchScannerStatus } from '../lib/api';

export function useStats() {
  const [stats, setStats] = useState<AnomalyStats | null>(null);
  const [scanner, setScanner] = useState<ScannerStatus | null>(null);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const [s, sc] = await Promise.all([
          fetchAnomalyStats(),
          fetchScannerStatus(),
        ]);
        if (active) {
          setStats(s);
          setScanner(sc);
        }
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

  return { stats, scanner };
}
