import type { MarketSnapshot } from '../types';

function formatVolume(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

export function TopMarkets({ markets }: { markets: MarketSnapshot[] }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">
        Top Markets
      </p>
      {markets.length === 0 ? (
        <p className="text-[12px] text-white/25">Loading...</p>
      ) : (
        <div className="space-y-0.5">
          {markets.map((m, i) => {
            const price = Math.round(m.outcomeYes * 100);
            const priceColor = price >= 50 ? '#30d158' : '#ff453a';
            return (
              <a
                key={m.conditionId}
                href={`https://polymarket.com/event/${m.eventSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
              >
                <span className="w-4 shrink-0 text-right font-mono text-[10px] text-white/25">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px] text-white/60" title={m.question}>
                  {m.question}
                </span>
                <span
                  className="shrink-0 font-mono text-[12px] font-semibold"
                  style={{ color: priceColor }}
                >
                  {price}¢
                </span>
                <span className="shrink-0 font-mono text-[11px] text-white/30">
                  {formatVolume(m.volume)}
                </span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
