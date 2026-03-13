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
  PRICE_SPIKE: '#ff5252',
  VOLUME_SURGE: '#6c5ce7',
  SPREAD_ANOMALY: '#ffab40',
  WHALE_TRADE: '#40c4ff',
  CROSS_PLATFORM_ARB: '#00e676',
  NEW_MARKET_HOT: '#ffd740',
};

const TYPE_LABELS: Record<string, string> = {
  PRICE_SPIKE: 'Price Spike',
  VOLUME_SURGE: 'Volume Surge',
  SPREAD_ANOMALY: 'Spread',
  WHALE_TRADE: 'Whale Trade',
  CROSS_PLATFORM_ARB: 'Arb',
  NEW_MARKET_HOT: 'New Hot',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#ff5252',
  HIGH: '#ffab40',
  MEDIUM: '#ffd740',
  LOW: '#40c4ff',
};

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function Sidebar({ stats, scanner, markets }: SidebarProps) {
  const maxType = stats
    ? Math.max(...Object.values(stats.byType), 1)
    : 1;
  const maxSev = stats
    ? Math.max(...Object.values(stats.bySeverity), 1)
    : 1;

  return (
    <aside className="space-y-6 overflow-y-auto">
      {/* Overview */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7394]">
          Overview
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Active"
            value={stats?.total ?? 0}
            color="#6c5ce7"
          />
          <StatCard
            label="Last 24h"
            value={stats?.last24h ?? 0}
            color="#ffab40"
          />
          <StatCard
            label="Markets"
            value={scanner?.marketsTracked ?? 0}
            color="#40c4ff"
          />
          <StatCard
            label="Scanner"
            value={scanner?.isRunning ? 'Active' : 'Stopped'}
            color={scanner?.isRunning ? '#00e676' : '#ff5252'}
          />
        </div>
      </div>

      {/* By Type */}
      {stats && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7394]">
            By Type
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <DistroBar
                key={type}
                label={TYPE_LABELS[type] || type}
                value={count}
                max={maxType}
                color={TYPE_COLORS[type] || '#6b7394'}
              />
            ))}
          </div>
        </div>
      )}

      {/* By Severity */}
      {stats && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#6b7394]">
            By Severity
          </h3>
          <div className="space-y-2">
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
        <div className="rounded-lg border border-white/5 bg-[#12141c] p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[#6b7394]">
            Uptime
          </p>
          <p className="font-mono text-sm font-bold text-[#b0b8cf]">
            {formatUptime(scanner.uptime)}
          </p>
        </div>
      )}
    </aside>
  );
}
