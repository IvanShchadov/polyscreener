import { useEffect, useState, useRef, useCallback } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { fetchAnomalies } from '../lib/api';
import { TradeButton } from '../components/TradeButton';
import type { Anomaly } from '../types';

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function SpreadBadge({ diff }: { diff: number }) {
  const color = diff >= 8 ? '#ff453a' : diff >= 5 ? '#ff9f0a' : '#ffd60a';
  return (
    <span
      className="rounded-lg px-2.5 py-1 font-mono text-[12px] font-semibold"
      style={{ backgroundColor: color + '18', color }}
    >
      {diff}¢
    </span>
  );
}

export function ArbitragePage() {
  const [opportunities, setOpportunities] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async function refresh() {
    setLoading(true);
    try {
      const all = await fetchAnomalies({ type: 'CROSS_PLATFORM_ARB', limit: 100 });
      // Sort by diffCents descending
      all.sort((a, b) => {
        const da = Number(a.metadata.diffCents ?? 0);
        const db = Number(b.metadata.diffCents ?? 0);
        return db - da;
      });
      setOpportunities(all);
      setLastRefresh(Date.now());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 30_000);
    // Tick every 5s to update the "Updated X ago" label
    const tickId = setInterval(() => setTick((t) => t + 1), 5_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(tickId);
    };
  }, [refresh]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold">Arbitrage</h2>
          <p className="mt-0.5 text-[13px] text-white/40">
            Price gaps between Polymarket and Kalshi — auto-refreshes every 30s
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl bg-white/[0.05] px-3 py-2 text-[12px] text-white/50 ring-1 ring-white/[0.06] transition-colors hover:bg-white/[0.08] disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Scanning...' : `Updated ${timeAgo(lastRefresh)}`}
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[12px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ffd60a]" /> &lt;5¢ gap
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ff9f0a]" /> 5–8¢ gap
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#ff453a]" /> &gt;8¢ gap
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl ring-1 ring-white/[0.07]">
        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_80px_80px_80px_100px] border-b border-white/[0.06] bg-white/[0.03] px-5 py-3">
          <span className="text-[11px] font-medium text-white/35">Event</span>
          <span className="text-right text-[11px] font-medium text-white/35">Poly</span>
          <span className="text-right text-[11px] font-medium text-white/35">Kalshi</span>
          <span className="text-right text-[11px] font-medium text-white/35">Gap</span>
          <span className="text-right text-[11px] font-medium text-white/35">Detected</span>
          <span />
        </div>

        {/* Rows */}
        {!loading && opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <TrendingUp className="mb-4 h-10 w-10 text-white/15" />
            <p className="text-[14px] font-medium text-white/35">No opportunities right now</p>
            <p className="mt-1 text-[12px] text-white/20">Scanning every 30 seconds</p>
          </div>
        ) : (
          <>
            {loading && opportunities.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 border-b border-white/[0.04] px-5 py-4 last:border-0">
                  <div className="h-3.5 flex-1 animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-3.5 w-12 animate-pulse rounded bg-white/[0.04]" />
                  <div className="h-3.5 w-12 animate-pulse rounded bg-white/[0.04]" />
                </div>
              ))
            ) : (
              opportunities.map((opp) => {
                const polyPrice = Number(opp.metadata.polyPrice ?? 0);
                const extPrice = Number(opp.metadata.extPrice ?? 0);
                const diff = Number(opp.metadata.diffCents ?? 0);
                const polyHigher = polyPrice > extPrice;

                return (
                  <div
                    key={opp.id}
                    className="grid grid-cols-[1fr_80px_80px_80px_80px_100px] items-center border-b border-white/[0.04] px-5 py-4 last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <div>
                      <p className="truncate text-[13px] text-white/75 pr-4" title={opp.question}>
                        {opp.question}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/30">
                        {String(opp.metadata.platform ?? 'Kalshi')} · {polyHigher ? 'Poly higher' : 'Kalshi higher'}
                      </p>
                    </div>
                    <p
                      className="text-right font-mono text-[13px] font-semibold"
                      style={{ color: polyHigher ? '#30d158' : '#ff453a' }}
                    >
                      {polyPrice}¢
                    </p>
                    <p
                      className="text-right font-mono text-[13px] font-semibold"
                      style={{ color: !polyHigher ? '#30d158' : '#ff453a' }}
                    >
                      {extPrice}¢
                    </p>
                    <div className="flex justify-end">
                      <SpreadBadge diff={diff} />
                    </div>
                    <p className="text-right font-mono text-[11px] text-white/30">
                      {timeAgo(opp.detectedAt)}
                    </p>
                    <div className="flex justify-end">
                      <TradeButton eventSlug={opp.eventSlug} />
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
