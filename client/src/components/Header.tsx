import { NavLink } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { useBuilderCode } from '../contexts/BuilderCodeContext';
import { buildPolymarketHomeUrl } from '../lib/polymarket';
import type { AnomalyStats, ScannerStatus } from '../types';

interface HeaderProps {
  stats: AnomalyStats | null;
  scanner: ScannerStatus | null;
  isConnected: boolean;
}

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

const NAV_LINKS = [
  { to: '/',          label: 'Feed',      end: true  },
  { to: '/markets',   label: 'Markets',   end: false },
  { to: '/arb',       label: 'Arbitrage', end: false },
  { to: '/portfolio', label: 'Portfolio', end: false },
];

export function Header({ stats, scanner, isConnected }: HeaderProps) {
  const builderCode = useBuilderCode();

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

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    isActive ? 'bg-white/[0.10] text-white' : 'text-white/45 hover:text-white/75'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: stats + trade CTA */}
        <div className="hidden items-center gap-5 sm:flex">
          <StatPill label="Markets" value={scanner?.marketsTracked ?? 0} />
          <StatPill label="1h" value={stats?.last1h ?? 0} />
          <StatPill label="Uptime" value={scanner ? formatUptime(scanner.uptime) : '—'} />

          <a
            href={buildPolymarketHomeUrl(builderCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-[#007AFF] px-3.5 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-85 hover:scale-[1.02]"
          >
            Trade
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>
      </div>
    </header>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="text-white/35">{label}</span>
      <span className="font-mono font-medium text-white/60">{value}</span>
    </div>
  );
}
