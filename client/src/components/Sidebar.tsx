import { Bell } from 'lucide-react';
import type { AnomalyStats, ScannerStatus, MarketSnapshot, Anomaly } from '../types';
import { StatCard } from './StatCard';
import { TopMarkets } from './TopMarkets';

interface SidebarProps {
  stats: AnomalyStats | null;
  scanner: ScannerStatus | null;
  markets: MarketSnapshot[];
  recentAnomalies?: Anomaly[];
  notifPermission?: NotificationPermission;
  onRequestNotifications?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  PRICE_SPIKE:        'Price Spike',
  VOLUME_SURGE:       'Volume Surge',
  SPREAD_ANOMALY:     'Spread',
  WHALE_TRADE:        'Whale Trade',
  CROSS_PLATFORM_ARB: 'Arb',
  NEW_MARKET_HOT:     'New Hot',
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

/** Apple Settings-style grouped rows */
function SettingsGroup({ rows }: { rows: { label: string; value: string | number }[] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white/[0.05]">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center justify-between px-4 py-2.5 ${
            i > 0 ? 'border-t border-white/[0.05]' : ''
          }`}
        >
          <span className="text-[13px] text-white/50">{row.label}</span>
          <span className="text-[13px] text-white/80">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Sidebar({ stats, scanner, markets, recentAnomalies = [], notifPermission, onRequestNotifications }: SidebarProps) {
  const notifSupported = 'Notification' in window;
  const notifGranted = notifPermission === 'granted';

  return (
    <aside className="space-y-6 overflow-y-auto">
      {/* Overview */}
      <div>
        <SectionLabel>Overview</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Active" value={stats?.total ?? 0} />
          <StatCard label="Last 24h" value={stats?.last24h ?? 0} />
          <StatCard label="Markets" value={scanner?.marketsTracked ?? 0} />
          <StatCard
            label="Scanner"
            value={scanner?.isRunning ? 'Active' : 'Stopped'}
            color={scanner?.isRunning ? '#30d158' : '#ff453a'}
          />
        </div>
      </div>

      {/* Notifications */}
      {notifSupported && !notifGranted && (
        <div className="rounded-xl bg-white/[0.05] p-4">
          <div className="mb-2 flex items-center gap-2">
            <Bell className="h-4 w-4 text-white/40" />
            <p className="text-[13px] font-medium text-white/80">Notifications</p>
          </div>
          {notifPermission === 'denied' ? (
            <p className="text-[12px] leading-relaxed text-white/35">
              Notifications blocked. Enable them in your browser settings to receive alerts.
            </p>
          ) : (
            <>
              <p className="mb-3 text-[12px] leading-relaxed text-white/40">
                Get alerts for critical anomalies in real time.
              </p>
              <button
                onClick={onRequestNotifications}
                className="w-full rounded-xl border border-white/20 py-2 text-[13px] font-medium text-white/60 transition-all hover:border-[#007AFF] hover:text-[#007AFF]"
              >
                Enable Alerts
              </button>
            </>
          )}
        </div>
      )}

      {/* Hot Right Now */}
      {recentAnomalies.length > 0 && (
        <div>
          <SectionLabel>Hot Right Now</SectionLabel>
          <div className="space-y-0.5">
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
          <SettingsGroup
            rows={Object.entries(stats.byType).map(([type, count]) => ({
              label: TYPE_LABELS[type] || type,
              value: count,
            }))}
          />
        </div>
      )}

      {/* By Severity */}
      {stats && (
        <div>
          <SectionLabel>By Severity</SectionLabel>
          <SettingsGroup
            rows={(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => ({
              label: sev.charAt(0) + sev.slice(1).toLowerCase(),
              value: stats.bySeverity[sev],
            }))}
          />
        </div>
      )}

      {/* Top Markets */}
      <TopMarkets markets={markets} />

      {/* Uptime */}
      {scanner && (
        <div className="rounded-xl bg-white/[0.05] px-4 py-3 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Uptime</p>
          <p className="mt-1.5 text-[15px] font-semibold text-white/60">
            {formatUptime(scanner.uptime)}
          </p>
        </div>
      )}
    </aside>
  );
}
