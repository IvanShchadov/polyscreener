import type { AnomalyStats, ScannerStatus } from '../types';

interface HeaderProps {
  stats: AnomalyStats | null;
  scanner: ScannerStatus | null;
  isConnected: boolean;
  page?: 'feed' | 'portfolio';
  onPageChange?: (p: 'feed' | 'portfolio') => void;
}

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function Header({ stats, scanner, isConnected, page, onPageChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#111113]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3.5">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[15px] font-semibold tracking-tight text-white">
              PolyScreener
            </h1>
            <span
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                isConnected ? 'bg-[#30d158]' : 'bg-[#ff453a]'
              }`}
            />
          </div>

          {/* Segment control */}
          <nav className="hidden sm:flex items-center rounded-lg bg-white/[0.06] p-0.5">
            {(['feed', 'portfolio'] as const).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange?.(p)}
                className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                  page === p
                    ? 'bg-white/[0.12] text-white shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {p === 'feed' ? 'Feed' : 'Portfolio'}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: stats pills */}
        <div className="hidden items-center gap-5 sm:flex">
          <StatPill label="Markets" value={scanner?.marketsTracked ?? 0} />
          <StatPill label="Anomalies 1h" value={stats?.last1h ?? 0} />
          <StatPill label="Uptime" value={scanner ? formatUptime(scanner.uptime) : '—'} />
        </div>
      </div>
    </header>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="text-white/40">{label}</span>
      <span className="font-mono font-medium text-white/70">{value}</span>
    </div>
  );
}
