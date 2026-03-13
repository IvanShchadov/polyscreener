import type { MarketSnapshot } from '../types';

function formatVolume(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

export function TopMarkets({ markets }: { markets: MarketSnapshot[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6b7394]">
        Top Markets
      </h3>
      {markets.length === 0 ? (
        <p className="text-xs text-[#6b7394]/60">Loading...</p>
      ) : (
        <div className="space-y-1">
          {markets.map((m, i) => {
            const price = Math.round(m.outcomeYes * 100);
            const priceColor = price >= 50 ? '#00e676' : '#ff5252';
            return (
              <a
                key={m.conditionId}
                href={`https://polymarket.com/event/${m.eventSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-[#1a1d28]"
              >
                <span className="w-5 shrink-0 text-right font-mono text-[10px] text-[#6b7394]">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs text-[#b0b8cf]">
                  {m.question}
                </span>
                <span
                  className="shrink-0 font-mono text-xs font-semibold"
                  style={{ color: priceColor }}
                >
                  {price}¢
                </span>
                <span className="shrink-0 font-mono text-[10px] text-[#6b7394]">
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
