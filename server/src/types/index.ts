export type AnomalyType =
  | 'PRICE_SPIKE'
  | 'VOLUME_SURGE'
  | 'SPREAD_ANOMALY'
  | 'WHALE_TRADE'
  | 'CROSS_PLATFORM_ARB'
  | 'NEW_MARKET_HOT';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

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

export interface PricePoint {
  timestamp: number;
  yes: number;
  no: number;
}

export interface PriceHistory {
  conditionId: string;
  points: PricePoint[];
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

export interface GammaMarket {
  id: string;
  question: string;
  condition_id: string;
  slug: string;
  volume: string;
  volume_num: number;
  liquidity: string;
  liquidity_num: number;
  outcome_prices: string | string[];
  clob_token_ids: string | string[];
  spread: number;
  best_bid: number;
  best_ask: number;
  tags: { label: string }[] | string[];
  active: boolean;
  closed: boolean;
  archived: boolean;
}

export interface CLOBTrade {
  asset_id: string;
  price: string;
  size: string;
  side: string;
  timestamp: string;
}
