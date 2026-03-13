import { usePortfolio } from '../hooks/usePortfolio';
import type { PortfolioPosition, TradeActivity } from '../types';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatUsdc(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

function formatPrice(n: number): string {
  return (n * 100).toFixed(1) + '¢';
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: color + '20', color }}
    >
      {text}
    </span>
  );
}

function SummaryCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#12141c] p-3">
      <p className="mb-1 text-[11px] text-[#6b7394] uppercase tracking-wider">{label}</p>
      <div className="font-mono text-lg font-bold">{children}</div>
    </div>
  );
}

function PositionsTable({ positions }: { positions: PortfolioPosition[] }) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#12141c]">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <span className="text-sm font-semibold text-[#f1f3f9]">Open Positions</span>
        <span className="rounded-full bg-[#6c5ce7]/20 px-2 py-0.5 text-[11px] font-mono text-[#6c5ce7]">
          {positions.length}
        </span>
      </div>
      {positions.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-[#6b7394]">No open positions</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[#6b7394]">
                <th className="px-4 py-2 text-left font-medium">Market</th>
                <th className="px-3 py-2 text-left font-medium">Outcome</th>
                <th className="px-3 py-2 text-right font-medium">Size</th>
                <th className="px-3 py-2 text-right font-medium">Avg</th>
                <th className="px-3 py-2 text-right font-medium">Current</th>
                <th className="px-3 py-2 text-right font-medium">Value</th>
                <th className="px-3 py-2 text-right font-medium">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, i) => {
                const pnlPositive = pos.pnl >= 0;
                const outcomeColor = pos.outcome.toUpperCase() === 'YES' ? '#00e676' : '#ff5252';
                return (
                  <tr
                    key={pos.conditionId + i}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-2.5 max-w-[220px]">
                      {pos.eventSlug ? (
                        <a
                          href={`https://polymarket.com/event/${pos.eventSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="line-clamp-2 text-[#b0b8cf] hover:text-[#6c5ce7] transition-colors leading-snug"
                        >
                          {pos.question || pos.conditionId}
                        </a>
                      ) : (
                        <span className="line-clamp-2 text-[#b0b8cf] leading-snug">
                          {pos.question || pos.conditionId}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge text={pos.outcome || '—'} color={outcomeColor} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#b0b8cf]">
                      {pos.size.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#b0b8cf]">
                      {formatPrice(pos.avgPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#b0b8cf]">
                      {formatPrice(pos.currentPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#b0b8cf]">
                      {formatUsdc(pos.currentValue)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      <span style={{ color: pnlPositive ? '#00e676' : '#ff5252' }}>
                        {formatUsdc(pos.pnl)}
                      </span>
                      <span
                        className="ml-1 text-[10px]"
                        style={{ color: pnlPositive ? '#00e676' : '#ff5252' }}
                      >
                        {formatPct(pos.pnlPct)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ActivityTable({ activity }: { activity: TradeActivity[] }) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#12141c]">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <span className="text-sm font-semibold text-[#f1f3f9]">Recent Activity</span>
        <span className="rounded-full bg-[#6c5ce7]/20 px-2 py-0.5 text-[11px] font-mono text-[#6c5ce7]">
          {activity.length}
        </span>
      </div>
      {activity.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-[#6b7394]">No recent activity</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/5 text-[#6b7394]">
                <th className="px-4 py-2 text-left font-medium">Time</th>
                <th className="px-3 py-2 text-left font-medium">Market</th>
                <th className="px-3 py-2 text-left font-medium">Outcome</th>
                <th className="px-3 py-2 text-left font-medium">Side</th>
                <th className="px-3 py-2 text-right font-medium">Price</th>
                <th className="px-3 py-2 text-right font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((trade, i) => {
                const outcomeColor =
                  trade.outcome.toUpperCase() === 'YES' ? '#00e676' : '#ff5252';
                const sideColor = trade.side === 'BUY' ? '#00e676' : '#ff5252';
                return (
                  <tr
                    key={trade.id + i}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-[#6b7394] whitespace-nowrap">
                      {trade.timestamp ? timeAgo(trade.timestamp) : '—'}
                    </td>
                    <td className="px-3 py-2.5 max-w-[160px]">
                      {trade.eventSlug ? (
                        <a
                          href={`https://polymarket.com/event/${trade.eventSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate text-[#b0b8cf] hover:text-[#6c5ce7] transition-colors"
                        >
                          {trade.question || trade.id}
                        </a>
                      ) : (
                        <span className="block truncate text-[#b0b8cf]">
                          {trade.question || trade.id}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge text={trade.outcome || '—'} color={outcomeColor} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge text={trade.side} color={sideColor} />
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#b0b8cf]">
                      {formatPrice(trade.price)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#b0b8cf]">
                      {formatUsdc(trade.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function Portfolio() {
  const { address, setAddress, data, loading, error, load } = usePortfolio();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (address.trim()) load(address.trim());
  }

  const pnlPositive = data ? data.summary.totalPnl >= 0 : true;

  return (
    <div className="w-full space-y-6">
      {/* Address input bar */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Polymarket wallet address (0x...)"
          className="flex-1 rounded-lg border border-white/10 bg-[#12141c] px-4 py-2.5 text-sm text-[#f1f3f9] placeholder-[#6b7394] outline-none focus:border-[#6c5ce7]/60 transition-colors font-mono"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !address.trim()}
          className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#6c5ce7' }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Loading
            </span>
          ) : (
            'Load'
          )}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-[#ff5252]/20 bg-[#ff5252]/10 px-4 py-2.5 text-sm text-[#ff5252]">
          {error}
        </p>
      )}

      {/* Empty / initial state */}
      {!data && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="mb-4 text-5xl">👛</span>
          <p className="text-[#6b7394]">Enter your wallet address to view portfolio</p>
        </div>
      )}

      {/* Loaded state */}
      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryCard label="Total Invested">
              <span className="text-[#f1f3f9]">{formatUsdc(data.summary.totalInvested)}</span>
            </SummaryCard>
            <SummaryCard label="Current Value">
              <span className="text-[#f1f3f9]">{formatUsdc(data.summary.totalCurrentValue)}</span>
            </SummaryCard>
            <SummaryCard label="P&L">
              <span style={{ color: pnlPositive ? '#00e676' : '#ff5252' }}>
                {formatUsdc(data.summary.totalPnl)}
              </span>
              <span
                className="ml-2 text-sm font-normal"
                style={{ color: pnlPositive ? '#00e676' : '#ff5252' }}
              >
                {formatPct(data.summary.totalPnlPct)}
              </span>
            </SummaryCard>
            <SummaryCard label="Open Positions">
              <span className="text-[#f1f3f9]">{data.summary.openPositions}</span>
            </SummaryCard>
            <SummaryCard label="Total Shares">
              <span className="text-[#f1f3f9]">
                {data.summary.totalShares.toLocaleString('en-US', { maximumFractionDigits: 1 })}
              </span>
            </SummaryCard>
            <SummaryCard label="If All Win">
              <span style={{ color: '#00e676' }}>
                +{formatUsdc(data.summary.potentialWinnings)}
              </span>
            </SummaryCard>
          </div>

          {/* Positions + Activity */}
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <PositionsTable positions={data.positions} />
            <ActivityTable activity={data.activity} />
          </div>
        </>
      )}
    </div>
  );
}
