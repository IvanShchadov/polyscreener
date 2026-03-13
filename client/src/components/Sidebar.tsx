import type { AnomalyStats, ScannerStatus, MarketSnapshot } from '../types';
import { StatCard } from './StatCard';
import { DistroBar } from './DistroBar';
import { TopMarkets } from './TopMarkets';

interface SidebarProps {
  stats: AnomalyStats | null;
  scanner: ScannerStatus | null;
  markets: MarketSnapshot[];
}

const TYPE_COLORS: Record<string, string> = {
  PRICE_SPIKE:        '#ff453a',
  VOLUME_SURGE:       '#bf5af2',
  SPREAD_ANOMALY:     '#ff9f0a',
  WHALE_TRADE:        '#5ac8fa',
  CROSS_PLATFORM_ARB: '#30d158',
  NEW_MARKET_HOT:     '#ffd60a',
};

const TYPE_LABELS: Record<string, string> = {
  PRICE_SPIKE:        'Price Spike',
  VOLUME_SURGE:       'Volume Surge',
  SPREAD_ANOMALY:     'Spread',
  WHALE_TRADE:        'Whale Trade',
  CROSS_PLATFORM_ARB: 'Arb',
  NEW_MARKET_HOT:     'New Hot',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff453a',
  HIGH:     '#ff9f0a',
  MEDIUM:   '#ffd60a',
  LOW:      '#5ac8fa',
};

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/25">
      {children}
    </p>
  );
}

export function Sidebar({ stats, scanner, markets }: SidebarProps) {
  const maxType = stats ? Math.max(...Object.values(stats.byType), 1) : 1;
  const maxSev = stats ? Math.max(...Object.values(stats.bySeverity), 1) : 1;

  return (
    <aside className="space-y-6 overflow-y-auto">
      {/* Overview */}
      <div>
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Active" value={stats?.total ?? 0} color="#bf5af2" />
          <StatCard label="Last 24h" value={stats?.last24h ?? 0} color="#ff9f0a" />
          <StatCard label="Markets" value={scanner?.marketsTracked ?? 0} color="#5ac8fa" />
          <StatCard
            label="Scanner"
            value={scanner?.isRunning ? 'Active' : 'Stopped'}
            color={scanner?.isRunning ? '#30d158' : '#ff453a'}
          />
        </div>
      </div>

      {/* By Type */}
      {stats && (
        <div>
          <SectionLabel>By Type</SectionLabel>
          <div className="space-y-2.5">
            {Object.entries(stats.byType).map(([type, count]) => (
              <DistroBar
                key={type}
                label={TYPE_LABELS[type] || type}
                value={count}
                max={maxType}
                color={TYPE_COLORS[type] || 'rgba(255,255,255,0.3)'}
              />
            ))}
          </div>
        </div>
      )}

      {/* By Severity */}
      {stats && (
        <div>
          <SectionLabel>By Severity</SectionLabel>
          <div className="space-y-2.5">
            {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
              <DistroBar
                key={sev}
                label={sev.charAt(0) + sev.slice(1).toLowerCase()}
                value={stats.bySeverity[sev]}
                max={maxSev}
                color={SEVERITY_COLORS[sev]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Markets */}
      <TopMarkets markets={markets} />

      {/* Uptime */}
      {scanner && (
        <div className="rounded-xl bg-white/[0.04] px-4 py-3 text-center ring-1 ring-white/[0.07]">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Uptime</p>
          <p className="mt-1.5 font-mono text-[15px] font-semibold text-white/60">
            {formatUptime(scanner.uptime)}
          </p>
        </div>
      )}
    </aside>
  );
}
