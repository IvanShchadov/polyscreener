import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { fetchMarkets } from '../lib/api';
import { TradeButton } from '../components/TradeButton';
import type { MarketSnapshot } from '../types';

const TAGS: { label: string; value: string | null }[] = [
  { label: 'All',         value: null },
  { label: 'Politics',    value: 'politics' },
  { label: 'Elections',   value: 'elections' },
  { label: 'Crypto',      value: 'crypto' },
  { label: 'Sports',      value: 'sports' },
  { label: 'Finance',     value: 'finance' },
  { label: 'Tech',        value: 'tech' },
  { label: 'Science',     value: 'science' },
  { label: 'Business',    value: 'business' },
  { label: 'Geopolitics', value: 'geopolitics' },
  { label: 'Culture',     value: 'culture' },
  { label: 'Economy',     value: 'economy' },
];
const PAGE_SIZE = 50;

type SortKey = 'volume' | 'liquidity' | 'price' | 'spread';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, sort, dir }: { col: SortKey; sort: SortKey; dir: SortDir }) {
  if (col !== sort) return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
  return dir === 'desc'
    ? <ChevronDown className="h-3 w-3 text-[#007AFF]" />
    : <ChevronUp className="h-3 w-3 text-[#007AFF]" />;
}

function formatVolume(n: number) {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

export function MarketsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('volume');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [markets, setMarkets] = useState<MarketSnapshot[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    const currentOffset = reset ? 0 : offset;
    try {
      const res = await fetchMarkets({
        q: query || undefined,
        tag: tag ?? undefined,
        sort: sort === 'volume' || sort === 'liquidity' ? sort : 'volume',
        limit: PAGE_SIZE,
        offset: currentOffset,
      });

      let list = res.markets;
      // Client-side sort for price and spread
      if (sort === 'price') {
        list.sort((a, b) => sortDir === 'desc' ? b.outcomeYes - a.outcomeYes : a.outcomeYes - b.outcomeYes);
      } else if (sort === 'spread') {
        list.sort((a, b) => sortDir === 'desc' ? b.spread - a.spread : a.spread - b.spread);
      } else if (sortDir === 'asc') {
        list.reverse();
      }

      setTotal(res.total);
      setMarkets(reset ? list : (prev) => [...prev, ...list]);
      setOffset(currentOffset + PAGE_SIZE);
      setHasMore(currentOffset + PAGE_SIZE < res.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [query, tag, sort, sortDir, offset]);

  // Reset and reload on filter change
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tag, sort, sortDir]);

  // Auto-retry while scanner is warming up
  useEffect(() => {
    if (total === 0 && !loading) {
      const t = setTimeout(() => load(true), 5000);
      return () => clearTimeout(t);
    }
  }, [total, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSort(col: SortKey) {
    if (sort === col) {
      setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSort(col);
      setSortDir('desc');
    }
  }

  const ThBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(col)}
      className="flex items-center gap-1 text-[11px] font-medium text-white/35 hover:text-white/60 transition-colors"
    >
      {label}
      <SortIcon col={col} sort={sort} dir={sortDir} />
    </button>
  );

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search markets..."
          className="w-full rounded-xl bg-white/[0.05] py-3 pl-11 pr-4 text-[14px] text-white placeholder-white/25 outline-none ring-1 ring-white/[0.08] transition-all focus:ring-white/20"
        />
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2">
        {TAGS.map((t) => (
          <button
            key={t.label}
            onClick={() => setTag(t.value)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
              tag === t.value
                ? 'bg-[#007AFF] text-white'
                : 'bg-white/[0.05] text-white/50 hover:text-white/80 ring-1 ring-white/[0.06]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl ring-1 ring-white/[0.07]">
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-5 py-3">
          <span className="text-[13px] font-semibold">Markets</span>
          <span className="font-mono text-[12px] text-white/35">{total.toLocaleString()} tracked</span>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1fr_80px_100px_90px_80px_100px] border-b border-white/[0.06] bg-white/[0.02] px-5 py-2.5">
          <span className="text-[11px] font-medium text-white/35">Market</span>
          <div className="text-right"><ThBtn col="price" label="YES" /></div>
          <div className="text-right"><ThBtn col="volume" label="Volume" /></div>
          <div className="text-right"><ThBtn col="liquidity" label="Liquidity" /></div>
          <div className="text-right"><ThBtn col="spread" label="Spread" /></div>
          <span />
        </div>

        {/* Rows */}
        {markets.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[13px] text-white/35">
              {query ? `No markets matching "${query}"` : tag ? 'No markets in this category yet' : 'Scanner is warming up...'}
            </p>
            {!query && !tag && <p className="mt-1 text-[12px] text-white/20">Retrying automatically...</p>}
          </div>
        ) : (
          <div>
            {markets.map((m) => {
              const price = Math.round(m.outcomeYes * 100);
              const priceColor = price >= 50 ? '#30d158' : '#ff453a';
              return (
                <div
                  key={m.conditionId}
                  onClick={() => navigate(`/markets/${m.conditionId}`)}
                  className="grid cursor-pointer grid-cols-[1fr_80px_100px_90px_80px_100px] items-center border-b border-white/[0.04] px-5 py-3 transition-colors hover:bg-white/[0.03] last:border-0"
                >
                  <p className="truncate pr-4 text-[13px] text-white/75" title={m.question}>
                    {m.question}
                  </p>
                  <p
                    className="text-right font-mono text-[13px] font-semibold"
                    style={{ color: priceColor }}
                  >
                    {price}¢
                  </p>
                  <p className="text-right font-mono text-[12px] text-white/50">
                    {formatVolume(m.volume)}
                  </p>
                  <p className="text-right font-mono text-[12px] text-white/50">
                    {formatVolume(m.liquidity)}
                  </p>
                  <p className="text-right font-mono text-[12px] text-white/50">
                    {(m.spread * 100).toFixed(1)}¢
                  </p>
                  <div className="flex justify-end">
                    <TradeButton eventSlug={m.eventSlug} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="border-t border-white/[0.05] p-4 text-center">
            <button
              onClick={() => load(false)}
              disabled={loading}
              className="rounded-xl bg-white/[0.05] px-6 py-2 text-[13px] font-medium text-white/60 transition-colors hover:bg-white/[0.08] disabled:opacity-40"
            >
              {loading ? 'Loading...' : `Load more (${total - markets.length} remaining)`}
            </button>
          </div>
        )}

        {loading && markets.length === 0 && (
          <div className="space-y-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-3.5 flex-1 animate-pulse rounded bg-white/[0.06]" />
                <div className="h-3.5 w-10 animate-pulse rounded bg-white/[0.04]" />
                <div className="h-3.5 w-16 animate-pulse rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
