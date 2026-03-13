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

function OutcomePill({ text }: { text: string }) {
  const isYes = text.toUpperCase() === 'YES';
  return (
    <span
      className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: isYes ? '#30d158' + '18' : '#ff453a' + '18',
        color: isYes ? '#30d158' : '#ff453a',
      }}
    >
      {text}
    </span>
  );
}

function SidePill({ text }: { text: string }) {
  const isBuy = text === 'BUY';
  return (
    <span
      className="rounded-md px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: isBuy ? '#30d158' + '14' : '#ff453a' + '14',
        color: isBuy ? '#30d158' : '#ff453a',
      }}
    >
      {text}
    </span>
  );
}

function SummaryCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-4 py-3.5 ring-1 ring-white/[0.07]">
      <p className="mb-1.5 text-[11px] font-medium text-white/35">{label}</p>
      <div className="font-mono text-[17px] font-semibold leading-tight">{children}</div>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-[11px] font-medium text-white/35 first:rounded-tl-xl last:rounded-tr-xl">
      {children}
    </th>
  );
}

function TableHeaderRight({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-right text-[11px] font-medium text-white/35">
      {children}
    </th>
  );
}

function PositionsTable({ positions }: { positions: PortfolioPosition[] }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-white/[0.07]">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] bg-white/[0.03] px-4 py-3">
        <span className="text-[13px] font-semibold">Open Positions</span>
        <span className="rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[11px] text-white/50">
          {positions.length}
        </span>
      </div>
      {positions.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-white/30">No open positions</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <TableHeader>Market</TableHeader>
                <TableHeader>Outcome</TableHeader>
                <TableHeaderRight>Size</TableHeaderRight>
                <TableHeaderRight>Avg</TableHeaderRight>
                <TableHeaderRight>Current</TableHeaderRight>
                <TableHeaderRight>Value</TableHeaderRight>
                <TableHeaderRight>P&amp;L</TableHeaderRight>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos, i) => {
                const pnlPositive = pos.pnl >= 0;
                return (
                  <tr
                    key={pos.conditionId + i}
                    className="border-b border-white/[0.05] last:border-0 transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="max-w-[240px] px-4 py-3">
                      {pos.eventSlug ? (
                        <a
                          href={`https://polymarket.com/event/${pos.eventSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="line-clamp-2 text-[12px] leading-snug text-white/70 transition-colors hover:text-[#0a84ff]"
                        >
                          {pos.question || pos.conditionId}
                        </a>
                      ) : (
                        <span className="line-clamp-2 text-[12px] leading-snug text-white/70">
                          {pos.question || pos.conditionId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <OutcomePill text={pos.outcome || '—'} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] text-white/55">
                      {pos.size.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] text-white/55">
                      {formatPrice(pos.avgPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] text-white/55">
                      {formatPrice(pos.currentPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] text-white/70">
                      {formatUsdc(pos.currentValue)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px]">
                      <span style={{ color: pnlPositive ? '#30d158' : '#ff453a' }}>
                        {formatUsdc(pos.pnl)}
                      </span>
                      <span
                        className="ml-1 text-[10px]"
                        style={{ color: pnlPositive ? '#30d158' : '#ff453a', opacity: 0.7 }}
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
    <div className="overflow-hidden rounded-xl ring-1 ring-white/[0.07]">
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] bg-white/[0.03] px-4 py-3">
        <span className="text-[13px] font-semibold">Recent Activity</span>
        <span className="rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[11px] text-white/50">
          {activity.length}
        </span>
      </div>
      {activity.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-white/30">No recent activity</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                <TableHeader>Time</TableHeader>
                <TableHeader>Market</TableHeader>
                <TableHeader>Outcome</TableHeader>
                <TableHeader>Side</TableHeader>
                <TableHeaderRight>Price</TableHeaderRight>
                <TableHeaderRight>Value</TableHeaderRight>
              </tr>
            </thead>
            <tbody>
              {activity.map((trade, i) => (
                <tr
                  key={trade.id + i}
                  className="border-b border-white/[0.05] last:border-0 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-white/30">
                    {trade.timestamp ? timeAgo(trade.timestamp) : '—'}
                  </td>
                  <td className="max-w-[160px] px-4 py-3">
                    {trade.eventSlug ? (
                      <a
                        href={`https://polymarket.com/event/${trade.eventSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-[12px] text-white/60 transition-colors hover:text-[#0a84ff]"
                      >
                        {trade.question || trade.id}
                      </a>
                    ) : (
                      <span className="block truncate text-[12px] text-white/60">
                        {trade.question || trade.id}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <OutcomePill text={trade.outcome || '—'} />
                  </td>
                  <td className="px-4 py-3">
                    <SidePill text={trade.side} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] text-white/55">
                    {formatPrice(trade.price)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[12px] text-white/70">
                    {formatUsdc(trade.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/i;

function parseAddresses(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

interface PortfolioProps {
  address?: string;
  setAddress?: (v: string) => void;
  data?: ReturnType<typeof usePortfolio>['data'];
  loading?: boolean;
  error?: string | null;
  load?: (addrs: string[]) => void;
}

export function Portfolio(externalProps: PortfolioProps = {}) {
  const internal = usePortfolio();
  const address = externalProps.address ?? internal.address;
  const setAddress = externalProps.setAddress ?? internal.setAddress;
  const data = externalProps.data !== undefined ? externalProps.data : internal.data;
  const loading = externalProps.loading ?? internal.loading;
  const error = externalProps.error !== undefined ? externalProps.error : internal.error;
  const load = externalProps.load ?? internal.load;

  const addresses = parseAddresses(address);
  const hasInput = addresses.length > 0;
  const invalidAddresses = addresses.filter((a) => !ADDRESS_RE.test(a));
  const isValid = hasInput && invalidAddresses.length === 0;
  const showInvalid = hasInput && invalidAddresses.length > 0;
  const isMulti = addresses.length > 1;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isValid) load(addresses);
  }

  const pnlPositive = data ? data.summary.totalPnl >= 0 : true;

  return (
    <div className="w-full space-y-5">
      {/* Address input */}
      <form onSubmit={handleSubmit} className="flex gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Wallet address — separate multiple with commas"
            className={`w-full rounded-xl bg-white/[0.05] px-4 py-2.5 pr-9 text-[13px] font-mono text-white placeholder-white/25 outline-none ring-1 transition-all ${
              showInvalid
                ? 'ring-[#ff453a]/40 focus:ring-[#ff453a]/60'
                : isValid
                  ? 'ring-[#30d158]/35 focus:ring-[#30d158]/55'
                  : 'ring-white/[0.08] focus:ring-white/20'
            }`}
            disabled={loading}
          />
          {hasInput && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px]">
              {isValid
                ? <span className="text-[#30d158]">✓</span>
                : <span className="text-[#ff453a]">✗</span>
              }
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !isValid}
          className="whitespace-nowrap rounded-xl bg-[#0a84ff] px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-85"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading
            </span>
          ) : isMulti ? (
            `Load ${addresses.length} wallets`
          ) : (
            'Load'
          )}
        </button>
      </form>

      {/* Address badges */}
      {hasInput && addresses.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {addresses.map((addr, i) => {
            const valid = ADDRESS_RE.test(addr);
            return (
              <span
                key={i}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] ring-1"
                style={{
                  ringColor: valid ? '#30d158' + '35' : '#ff453a' + '35',
                  backgroundColor: valid ? '#30d158' + '10' : '#ff453a' + '10',
                  color: valid ? '#30d158' : '#ff453a',
                }}
              >
                {valid ? '✓' : '✗'} {addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr || '(empty)'}
              </span>
            );
          })}
        </div>
      )}

      {showInvalid && (
        <p className="text-[12px] text-[#ff453a]/80">
          {invalidAddresses.length === 1
            ? 'Invalid address — must be 0x followed by 40 hex characters'
            : `${invalidAddresses.length} invalid addresses`}
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-[#ff453a]/10 px-4 py-3 text-[13px] text-[#ff453a] ring-1 ring-[#ff453a]/20">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="mb-4 text-5xl opacity-30">◎</div>
          <p className="text-[14px] font-medium text-white/40">Enter a wallet address to view portfolio</p>
          <p className="mt-1.5 text-[12px] text-white/20">Separate multiple addresses with commas to aggregate</p>
        </div>
      )}

      {/* Loaded state */}
      {data && (
        <>
          {/* Aggregated wallets label */}
          {data.address.includes(', ') && (
            <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-white/35">
              <span>Aggregated</span>
              {data.address.split(', ').map((addr, i) => (
                <span key={i} className="rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-white/50">
                  {addr.slice(0, 6)}…{addr.slice(-4)}
                </span>
              ))}
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <SummaryCard label="P&L">
              <span style={{ color: pnlPositive ? '#30d158' : '#ff453a' }}>
                {formatUsdc(data.summary.totalPnl)}
              </span>
              <span
                className="ml-1.5 text-[12px] font-normal"
                style={{ color: pnlPositive ? '#30d158' : '#ff453a', opacity: 0.7 }}
              >
                {formatPct(data.summary.totalPnlPct)}
              </span>
            </SummaryCard>
            <SummaryCard label="Total Invested">
              <span className="text-white">{formatUsdc(data.summary.totalInvested)}</span>
            </SummaryCard>
            <SummaryCard label="Current Value">
              <span className="text-white">{formatUsdc(data.summary.totalCurrentValue)}</span>
            </SummaryCard>
            <SummaryCard label="Open Positions">
              <span className="text-white">{data.summary.openPositions}</span>
            </SummaryCard>
            <SummaryCard label="Total Shares">
              <span className="text-white">
                {data.summary.totalShares.toLocaleString('en-US', { maximumFractionDigits: 1 })}
              </span>
            </SummaryCard>
            <SummaryCard label="If All Win">
              <span style={{ color: '#30d158' }}>+{formatUsdc(data.summary.potentialWinnings)}</span>
            </SummaryCard>
          </div>

          {/* Positions + Activity */}
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <PositionsTable positions={data.positions} />
            <ActivityTable activity={data.activity} />
          </div>
        </>
      )}
    </div>
  );
}
