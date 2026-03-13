import { useState, useEffect } from 'react';
import type { Anomaly } from '../types';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff453a',
  HIGH:     '#ff9f0a',
  MEDIUM:   '#ffd60a',
  LOW:      '#5ac8fa',
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  PRICE_SPIKE:        { label: 'Price Spike',   color: '#ff453a' },
  VOLUME_SURGE:       { label: 'Volume Surge',  color: '#bf5af2' },
  SPREAD_ANOMALY:     { label: 'Spread',        color: '#ff9f0a' },
  WHALE_TRADE:        { label: 'Whale',         color: '#5ac8fa' },
  CROSS_PLATFORM_ARB: { label: 'Arb',           color: '#30d158' },
  NEW_MARKET_HOT:     { label: 'New Hot',       color: '#ffd60a' },
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

function formatCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toFixed(0);
}

function MetaValue({ k, v }: { k: string; v: string | number }) {
  const isPrice = k === 'currentPrice' || k === 'prevPrice' || k === 'polyPrice' || k === 'extPrice' || k === 'diffCents';
  const isPriceUp = k === 'direction' && v === 'up';
  const isPriceDown = k === 'direction' && v === 'down';

  let color = 'rgba(255,255,255,0.55)';
  if (isPriceUp) color = '#30d158';
  if (isPriceDown) color = '#ff453a';

  const labels: Record<string, string> = {
    prevPrice:     'From',
    currentPrice:  'To',
    changePercent: 'Change',
    direction:     'Dir',
    volume:        'Vol',
    avgVolume:     'Avg',
    multiplier:    'Mult',
    spread:        'Spread',
    bestBid:       'Bid',
    bestAsk:       'Ask',
    tradeSize:     'Size',
    price:         'Price',
    side:          'Side',
    liquidity:     'Liq',
    polyPrice:     'Poly',
    extPrice:      'Ext',
    diffCents:     'Gap',
    platform:      'Platform',
  };

  const display = labels[k] || k;
  const val = isPrice
    ? `${v}¢`
    : typeof v === 'number' && v >= 1000
      ? `$${formatCompact(v)}`
      : String(v);

  return (
    <span className="flex items-center gap-1">
      <span className="text-[11px] text-white/30">{display}</span>
      <span className="font-mono text-[11px]" style={{ color }}>{val}</span>
    </span>
  );
}

export function AnomalyCard({ anomaly }: { anomaly: Anomaly }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const sevColor = SEVERITY_COLORS[anomaly.severity] || 'rgba(255,255,255,0.3)';
  const typeInfo = TYPE_LABELS[anomaly.type] || { label: anomaly.type, color: 'rgba(255,255,255,0.5)' };

  return (
    <div className="animate-slideIn relative overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] transition-all duration-200 hover:bg-white/[0.06] hover:ring-white/[0.12]">
      {/* Severity accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ backgroundColor: sevColor, opacity: 0.65 }}
      />

      <div className="py-3.5 pr-4 pl-5">
        {/* Top row */}
        <div className="mb-2.5 flex items-center gap-1.5">
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: typeInfo.color + '18', color: typeInfo.color }}
          >
            {typeInfo.label}
          </span>
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: sevColor + '14', color: sevColor }}
          >
            {anomaly.severity.charAt(0) + anomaly.severity.slice(1).toLowerCase()}
          </span>
          <span className="ml-auto text-[11px] text-white/30">
            {timeAgo(anomaly.detectedAt)}
          </span>
        </div>

        {/* Question */}
        <p className="mb-1.5 text-[13px] font-medium leading-snug text-white line-clamp-2">
          {anomaly.question}
        </p>

        {/* Description */}
        <p className="mb-3 text-[12px] leading-relaxed text-white/45">{anomaly.description}</p>

        {/* Metadata */}
        <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5">
          {Object.entries(anomaly.metadata).map(([k, v]) => (
            <MetaValue key={k} k={k} v={v} />
          ))}
        </div>

        {/* Link */}
        {anomaly.eventSlug && (
          <a
            href={`https://polymarket.com/event/${anomaly.eventSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-medium text-[#0a84ff] transition-opacity hover:opacity-70"
          >
            View on Polymarket →
          </a>
        )}
      </div>
    </div>
  );
}
