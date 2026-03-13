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
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0b0f]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="font-outfit text-xl font-bold text-white tracking-tight">
            PolyScreener
          </h1>
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected
                ? 'bg-[#00e676] shadow-[0_0_8px_#00e676] animate-pulse'
                : 'bg-[#ff5252]'
            }`}
          />
          <span className="text-xs text-[#6b7394]">
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>

          <nav className="hidden items-center gap-1 sm:flex ml-4">
            {(['feed', 'portfolio'] as const).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange?.(p)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  page === p ? 'bg-[#6c5ce7] text-white' : 'text-[#6b7394] hover:text-[#b0b8cf]'
                }`}
              >
                {p === 'feed' ? 'Feed' : 'Portfolio'}
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-6 sm:flex">
          <StatPill
            label="Markets"
            value={scanner?.marketsTracked ?? 0}
          />
          <StatPill
            label="Anomalies 1h"
            value={stats?.last1h ?? 0}
          />
          <StatPill
            label="Uptime"
            value={scanner ? formatUptime(scanner.uptime) : '—'}
          />
        </div>
      </div>
    </header>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[#6b7394]">{label}</span>
      <span className="font-mono font-semibold text-[#b0b8cf]">{value}</span>
    </div>
  );
}
