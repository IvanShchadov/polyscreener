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
  eventSlug: string;
  description: string;
  metadata: Record<string, string | number>;
  detectedAt: number;
  expiresAt: number;
}

export interface MarketSnapshot {
  conditionId: string;
  question: string;
  slug: string;
  eventSlug: string;
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

export interface PortfolioPosition {
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

export interface TradeActivity {
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

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalPnl: number;
  totalPnlPct: number;
  openPositions: number;
  totalShares: number;
  potentialWinnings: number;
}

export interface PortfolioData {
  address: string;
  positions: PortfolioPosition[];
  activity: TradeActivity[];
  summary: PortfolioSummary;
}
