import type { Anomaly, AnomalyStats, MarketSnapshot, ScannerStatus, AnomalyType, Severity } from '../types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

export function fetchAnomalies(params?: {
  type?: AnomalyType;
  severity?: Severity;
  limit?: number;
}): Promise<Anomaly[]> {
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  if (params?.severity) qs.set('severity', params.severity);
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return get(`/anomalies${query ? `?${query}` : ''}`);
}

export function fetchAnomalyStats(): Promise<AnomalyStats> {
  return get('/anomalies/stats');
}

export function fetchMarkets(params?: {
  q?: string;
  tag?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; markets: MarketSnapshot[] }> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.tag) qs.set('tag', params.tag);
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return get(`/markets${query ? `?${query}` : ''}`);
}

export function fetchScannerStatus(): Promise<ScannerStatus> {
  return get('/markets/scanner/status');
}
