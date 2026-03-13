export type AnomalyType =
  | 'PRICE_SPIKE'
  | 'VOLUME_SURGE'
  | 'SPREAD_ANOMALY'
  | 'WHALE_TRADE'
  | 'CROSS_PLATFORM_ARB'
  | 'NEW_MARKET_HOT';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: Severity;
  conditionId: string;
  question: string;
  slug: string;
  description: string;
  metadata: Record<string, string | number>;
  detectedAt: number;
  expiresAt: number;
}

export interface MarketSnapshot {
  conditionId: string;
  question: string;
  slug: string;
  volume: number;
  liquidity: number;
  outcomeYes: number;
  outcomeNo: number;
  spread: number;
  bestBid: number;
  bestAsk: number;
  tags: string[];
  active: boolean;
  closed: boolean;
  clobTokenIds: string[];
  fetchedAt: number;
}

export interface AnomalyStats {
  total: number;
  last1h: number;
  last24h: number;
  byType: Record<AnomalyType, number>;
  bySeverity: Record<Severity, number>;
}

export interface ScannerStatus {
  isRunning: boolean;
  lastScan: number | null;
  marketsTracked: number;
  anomaliesFound: number;
  uptime: number;
}

export interface SSEMessage {
  type: 'init' | 'update';
  anomalies: Anomaly[];
}
