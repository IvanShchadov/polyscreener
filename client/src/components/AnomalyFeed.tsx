import { useState } from 'react';
import type { AnomalyType, Anomaly } from '../types';
import { AnomalyCard } from './AnomalyCard';

interface AnomalyFeedProps {
  anomalies: Anomaly[];
  isConnected: boolean;
}

const FILTERS: { label: string; value: AnomalyType | null }[] = [
  { label: 'All',     value: null },
  { label: 'Price',   value: 'PRICE_SPIKE' },
  { label: 'Volume',  value: 'VOLUME_SURGE' },
  { label: 'Whales',  value: 'WHALE_TRADE' },
  { label: 'Spread',  value: 'SPREAD_ANOMALY' },
  { label: 'New Hot', value: 'NEW_MARKET_HOT' },
  { label: 'Arbitrage', value: 'CROSS_PLATFORM_ARB' },
];

export function AnomalyFeed({ anomalies, isConnected }: AnomalyFeedProps) {
  const [filter, setFilter] = useState<AnomalyType | null>(null);

  const displayed = filter ? anomalies.filter((a) => a.type === filter) : anomalies;

  function countFor(value: AnomalyType | null): number {
    return value ? anomalies.filter((a) => a.type === value).length : anomalies.length;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Disconnect banner */}
      {!isConnected && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-[#ff9f0a]/10 px-3.5 py-2.5 text-[12px] text-[#ff9f0a] ring-1 ring-[#ff9f0a]/20">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff9f0a] animate-pulse" />
          Connection lost — reconnecting...
        </div>
      )}

      {/* Filter bar — segment control style */}
      <div className="mb-4 flex flex-wrap items-center gap-1 rounded-xl bg-white/[0.05] p-1 ring-1 ring-white/[0.06]">
        {FILTERS.map((f) => {
          const count = countFor(f.value);
          const active = filter === f.value;
          return (
            <button
              key={f.label}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
                active
                  ? 'bg-white/[0.12] text-white shadow-sm'
                  : 'text-white/45 hover:text-white/70'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 font-mono text-[10px] leading-5 ${
                    active ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-white/50'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 text-4xl opacity-20">📡</div>
            <p className="text-[13px] text-white/40">
              {filter ? 'No anomalies of this type yet' : 'No anomalies detected yet'}
            </p>
            <p className="mt-1 text-[12px] text-white/25">Scanner is monitoring markets...</p>
          </div>
        ) : (
          displayed.map((a) => <AnomalyCard key={a.id} anomaly={a} />)
        )}
      </div>
    </div>
  );
}
