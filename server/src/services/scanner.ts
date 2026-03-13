import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { fetchTopMarketSnapshots } from './polymarket.js';
import { detectAnomalies, detectCrossPlatformArbs, getAnomalies, pruneStaleMarkets } from './anomaly.js';
import { getExternalMarkets } from './crossPlatform.js';
import { updateSubscriptions, startWebSocket, setWhaleCallback } from './websocket.js';
import type { Anomaly, ScannerStatus } from '../types/index.js';

let intervalId: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let lastScan: number | null = null;
let marketsTracked = 0;
let startedAt: number | null = null;
let sseClients: ((anomalies: Anomaly[]) => void)[] = [];

export function registerSSEClient(cb: (anomalies: Anomaly[]) => void): () => void {
  sseClients.push(cb);
  return () => {
    sseClients = sseClients.filter((c) => c !== cb);
  };
}

function broadcastAnomalies(newAnomalies: Anomaly[]): void {
  for (const cb of sseClients) {
    try {
      cb(newAnomalies);
    } catch (err) {
      logger.warn({ err }, 'SSE client callback error');
    }
  }
}

async function runScan(): Promise<void> {
  try {
    logger.info('Starting scan cycle...');
    const snapshots = await fetchTopMarketSnapshots(config.maxMarketsToTrack);
    marketsTracked = snapshots.length;

    const newAnomalies = detectAnomalies(snapshots);
    lastScan = Date.now();

    // Prune stale market data for markets no longer in top N
    const activeIds = new Set(snapshots.map((s) => s.conditionId));
    pruneStaleMarkets(activeIds);

    // Update WS subscriptions for top 100 by volume
    const top100 = snapshots
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 100)
      .map((s) => ({ conditionId: s.conditionId, clobTokenIds: s.clobTokenIds }));
    updateSubscriptions(top100);

    // Cross-platform arbitrage detection
    const externalMarkets = await getExternalMarkets();
    const arbAnomalies = detectCrossPlatformArbs(snapshots, externalMarkets);

    const allNew = [...newAnomalies, ...arbAnomalies];
    if (allNew.length > 0) {
      broadcastAnomalies(allNew);
    }

    logger.info(
      {
        markets: marketsTracked,
        anomalies: newAnomalies.length,
        arbAnomalies: arbAnomalies.length,
        kalshiMarkets: externalMarkets.length,
      },
      'Scan complete',
    );
  } catch (err) {
    logger.error({ err }, 'Scan cycle error');
  }
}

export function startScanner(): void {
  if (isRunning) return;
  isRunning = true;
  startedAt = Date.now();

  logger.info({ interval: config.scanIntervalMs }, 'Starting scanner');

  // Start WebSocket for whale detection
  startWebSocket();
  setWhaleCallback((anomaly) => {
    broadcastAnomalies([anomaly]);
  });

  // Run immediately, then on interval
  runScan();
  intervalId = setInterval(runScan, config.scanIntervalMs);
}

export function stopScanner(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isRunning = false;
  logger.info('Scanner stopped');
}

export function getScannerStatus(): ScannerStatus {
  return {
    isRunning,
    lastScan,
    marketsTracked,
    anomaliesFound: getAnomalies().length,
    uptime: startedAt ? Date.now() - startedAt : 0,
  };
}
