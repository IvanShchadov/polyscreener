import { useState } from 'react';
import type { AnomalyType, Anomaly } from '../types';
import { AnomalyCard } from './AnomalyCard';

interface AnomalyFeedProps {
  anomalies: Anomaly[];
  allAnomalies: Anomaly[];
}

const FILTERS: { label: string; value: AnomalyType | null }[] = [
  { label: 'All', value: null },
  { label: 'Price', value: 'PRICE_SPIKE' },
  { label: 'Volume', value: 'VOLUME_SURGE' },
  { label: 'Whales', value: 'WHALE_TRADE' },
  { label: 'Arb', value: 'CROSS_PLATFORM_ARB' },
  { label: 'Spread', value: 'SPREAD_ANOMALY' },
];

export function AnomalyFeed({ anomalies, allAnomalies }: AnomalyFeedProps) {
  const [filter, setFilter] = useState<AnomalyType | null>(null);

  const displayed = filter
    ? allAnomalies.filter((a) => a.type === filter)
    : anomalies;

  return (
    <div className="flex h-full flex-col">
      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-[#6c5ce7] text-white'
                : 'bg-[#1a1d28] text-[#b0b8cf] hover:bg-[#252836]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 text-4xl opacity-30">📡</div>
            <p className="text-sm text-[#6b7394]">No anomalies detected yet</p>
            <p className="text-xs text-[#6b7394]/60">
              Scanner is monitoring markets...
            </p>
          </div>
        ) : (
          displayed.map((a) => <AnomalyCard key={a.id} anomaly={a} />)
        )}
      </div>
    </div>
  );
}
