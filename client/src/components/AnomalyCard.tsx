import { useState, useEffect } from 'react';
import type { Anomaly } from '../types';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff5252',
  HIGH: '#ffab40',
  MEDIUM: '#ffd740',
  LOW: '#40c4ff',
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  PRICE_SPIKE: { label: 'Price Spike', color: '#ff5252' },
  VOLUME_SURGE: { label: 'Volume Surge', color: '#6c5ce7' },
  SPREAD_ANOMALY: { label: 'Spread', color: '#ffab40' },
  WHALE_TRADE: { label: 'Whale', color: '#40c4ff' },
  CROSS_PLATFORM_ARB: { label: 'Arb', color: '#00e676' },
  NEW_MARKET_HOT: { label: 'New Hot', color: '#ffd740' },
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

function MetaValue({ k, v }: { k: string; v: string | number }) {
  const isPrice = k === 'currentPrice' || k === 'prevPrice' || k === 'polyPrice' || k === 'extPrice' || k === 'diffCents';
  const isPriceUp = k === 'direction' && v === 'up';
  const isPriceDown = k === 'direction' && v === 'down';

  let colorClass = 'text-[#b0b8cf]';
  if (isPriceUp) colorClass = 'text-[#00e676]';
  if (isPriceDown) colorClass = 'text-[#ff5252]';

  const labels: Record<string, string> = {
    prevPrice: 'From',
    currentPrice: 'To',
    changePercent: 'Change',
    direction: 'Dir',
    volume: 'Vol',
    avgVolume: 'Avg',
    multiplier: 'Mult',
    spread: 'Spread',
    bestBid: 'Bid',
    bestAsk: 'Ask',
    tradeSize: 'Size',
    price: 'Price',
    side: 'Side',
    liquidity: 'Liq',
    polyPrice: 'Poly',
    extPrice: 'Ext',
    diffCents: 'Gap',
    platform: 'Platform',
  };

  const display = labels[k] || k;
  const val = isPrice ? `${v}¢` : typeof v === 'number' && v >= 1000 ? `$${formatCompact(v)}` : String(v);

  return (
    <span className="flex items-center gap-1 text-xs">
      <span className="text-[#6b7394]">{display}:</span>
      <span className={`font-mono ${colorClass}`}>{val}</span>
    </span>
  );
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
}

export function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const sevColor = SEVERITY_COLORS[anomaly.severity] || '#6b7394';
  const typeInfo = TYPE_LABELS[anomaly.type] || { label: anomaly.type, color: '#6b7394' };

  return (
    <div className="animate-slideIn rounded-lg border border-white/5 bg-[#12141c] p-4 transition-colors hover:border-white/10">
      {/* Top row */}
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${anomaly.severity === 'CRITICAL' ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: sevColor, boxShadow: anomaly.severity === 'CRITICAL' ? `0 0 8px ${sevColor}` : undefined }}
        />
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}
        >
          {typeInfo.label}
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: sevColor + '20', color: sevColor }}
        >
          {anomaly.severity}
        </span>
        <span className="ml-auto text-[11px] text-[#6b7394]">
          {timeAgo(anomaly.detectedAt)}
        </span>
      </div>

      {/* Question */}
      <p className="mb-2 text-sm font-medium text-[#f1f3f9] line-clamp-2">
        {anomaly.question}
      </p>

      {/* Description */}
      <p className="mb-3 text-xs text-[#b0b8cf]">{anomaly.description}</p>

      {/* Metadata */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(anomaly.metadata).map(([k, v]) => (
          <MetaValue key={k} k={k} v={v} />
        ))}
      </div>

      {/* Link */}
      <a
        href={`https://polymarket.com/event/${anomaly.eventSlug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[#6c5ce7] hover:text-[#a29bfe] transition-colors"
      >
        View on Polymarket &rarr;
      </a>
    </div>
  );
}
