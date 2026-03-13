import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchMarket, fetchMarketPrices, fetchMarketAnomalies } from '../lib/api';
import { TradeButton } from '../components/TradeButton';
import { AnomalyCard } from '../components/AnomalyCard';
import type { MarketSnapshot, PricePoint, Anomaly } from '../types';

function formatVolume(n: number) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-4 py-3.5 ring-1 ring-white/[0.07]">
      <p className="mb-1.5 text-[11px] font-medium text-white/35">{label}</p>
      <p className="font-mono text-[18px] font-semibold" style={{ color: color || 'white' }}>
        {value}
      </p>
    </div>
  );
}

function PriceTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#1c1c1e] px-3 py-2 text-[12px] ring-1 ring-white/10">
      <span className="font-mono font-semibold text-white">{(payload[0].value * 100).toFixed(1)}¢</span>
    </div>
  );
}

export function MarketDetailPage() {
  const { conditionId } = useParams<{ conditionId: string }>();
  const navigate = useNavigate();

  const [market, setMarket] = useState<MarketSnapshot | null>(null);
  const [pricePoints, setPricePoints] = useState<PricePoint[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conditionId) return;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchMarket(conditionId),
      fetchMarketPrices(conditionId),
      fetchMarketAnomalies(conditionId),
    ])
      .then(([m, prices, anoms]) => {
        setMarket(m);
        setPricePoints(prices.points || []);
        setAnomalies(anoms);
      })
      .catch(() => setError('Market not found or not yet tracked'))
      .finally(() => setLoading(false));
  }, [conditionId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-white/[0.05]" />
        <div className="h-24 animate-pulse rounded-xl bg-white/[0.05]" />
        <div className="h-48 animate-pulse rounded-xl bg-white/[0.05]" />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-[14px] text-white/40">{error || 'Market not found'}</p>
        <button
          onClick={() => navigate('/markets')}
          className="mt-4 text-[13px] text-[#007AFF] hover:opacity-70"
        >
          ← Back to Markets
        </button>
      </div>
    );
  }

  const yesPrice = Math.round(market.outcomeYes * 100);
  const noPrice = Math.round(market.outcomeNo * 100);
  const priceColor = yesPrice >= 50 ? '#30d158' : '#ff453a';

  const chartData = pricePoints.map((p) => ({
    ts: p.timestamp,
    price: p.price,
  }));

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/markets')}
        className="flex items-center gap-1.5 text-[13px] text-white/40 transition-colors hover:text-white/70"
      >
        <ArrowLeft className="h-4 w-4" />
        Markets
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-white/25">
            {market.tags.slice(0, 3).join(' · ') || 'Market'}
          </p>
          <h1 className="text-[22px] font-semibold leading-snug text-white sm:text-[26px]">
            {market.question}
          </h1>
        </div>
        <div className="shrink-0">
          <TradeButton eventSlug={market.eventSlug} size="lg" label="Trade on Polymarket" />
        </div>
      </div>

      {/* Prices */}
      <div className="flex gap-6">
        <div>
          <p className="mb-1 text-[11px] font-medium text-white/35">YES</p>
          <p className="font-mono text-[36px] font-bold leading-none" style={{ color: priceColor }}>
            {yesPrice}¢
          </p>
        </div>
        <div className="flex items-center">
          <div className="h-12 w-px bg-white/[0.08]" />
        </div>
        <div>
          <p className="mb-1 text-[11px] font-medium text-white/35">NO</p>
          <p className="font-mono text-[36px] font-bold leading-none text-white/60">
            {noPrice}¢
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Volume" value={formatVolume(market.volume)} />
        <MetricCard label="Liquidity" value={formatVolume(market.liquidity)} />
        <MetricCard label="Spread" value={(market.spread * 100).toFixed(1) + '¢'} />
        <MetricCard label="Best Bid / Ask" value={`${Math.round(market.bestBid * 100)}¢ / ${Math.round(market.bestAsk * 100)}¢`} />
      </div>

      {/* Price chart */}
      {chartData.length > 1 && (
        <div className="rounded-xl bg-white/[0.04] p-5 ring-1 ring-white/[0.07]">
          <p className="mb-4 text-[13px] font-semibold">Price History</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="ts" hide />
              <YAxis
                domain={[0, 1]}
                tickFormatter={(v: number) => `${Math.round(v * 100)}¢`}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<PriceTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke={priceColor}
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <div>
          <p className="mb-3 text-[13px] font-semibold">
            Recent Anomalies
            <span className="ml-2 rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[11px] text-white/40">
              {anomalies.length}
            </span>
          </p>
          <div className="space-y-2">
            {anomalies.slice(0, 5).map((a) => (
              <AnomalyCard key={a.id} anomaly={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
