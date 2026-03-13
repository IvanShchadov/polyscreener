import { Bell } from 'lucide-react';
import type { AnomalyStats, ScannerStatus, MarketSnapshot, Anomaly } from '../types';
import { StatCard } from './StatCard';
import { DistroBar } from './DistroBar';
import { TopMarkets } from './TopMarkets';

interface SidebarProps {
  stats: AnomalyStats | null;
  scanner: ScannerStatus | null;
  markets: MarketSnapshot[];
  recentAnomalies?: Anomaly[];
  onRequestNotifications?: () => void;
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

const TYPE_ICONS: Record<string, string> = {
  PRICE_SPIKE:        '📈',
  VOLUME_SURGE:       '📊',
  SPREAD_ANOMALY:     '↔️',
  WHALE_TRADE:        '🐋',
  CROSS_PLATFORM_ARB: '⚡',
  NEW_MARKET_HOT:     '🔥',
};

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/25">
      {children}
    </p>
  );
}

export function Sidebar({ stats, scanner, markets, recentAnomalies = [], onRequestNotifications }: SidebarProps) {
  const maxType = stats ? Math.max(...Object.values(stats.byType), 1) : 1;
  const maxSev = stats ? Math.max(...Object.values(stats.bySeverity), 1) : 1;

  const notifSupported = 'Notification' in window;
  const notifGranted = notifSupported && Notification.permission === 'granted';

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

      {/* Notifications */}
      {notifSupported && !notifGranted && onRequestNotifications && (
        <div className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/[0.07]">
          <div className="mb-2.5 flex items-center gap-2">
            <Bell className="h-4 w-4 text-white/40" />
            <p className="text-[13px] font-medium">Notifications</p>
          </div>
          <p className="mb-3 text-[12px] leading-relaxed text-white/40">
            Get alerts for critical anomalies in real time.
          </p>
          <button
            onClick={onRequestNotifications}
            className="w-full rounded-xl bg-[#007AFF] py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            Enable Alerts
          </button>
        </div>
      )}

      {/* Hot Right Now */}
      {recentAnomalies.length > 0 && (
        <div>
          <SectionLabel>Hot Right Now</SectionLabel>
          <div className="space-y-1.5">
            {recentAnomalies.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-white/[0.04] transition-colors"
              >
                <span className="mt-0.5 text-[14px] leading-none">{TYPE_ICONS[a.type] ?? '⚡'}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-white/65" title={a.question}>
                    {a.question}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/30">{timeAgo(a.detectedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
