import { useEffect, useRef } from 'react';
import { AnomalyFeed } from '../components/AnomalyFeed';
import { Sidebar } from '../components/Sidebar';
import type { Anomaly, AnomalyStats, MarketSnapshot, ScannerStatus, Severity } from '../types';

interface DashboardPageProps {
  anomalies: Anomaly[];
  isConnected: boolean;
  stats: AnomalyStats | null;
  scanner: ScannerStatus | null;
  markets: MarketSnapshot[];
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Web Audio API not available
  }
}

interface NotificationState {
  enabled: boolean;
  permission: NotificationPermission;
  minSeverity: Severity;
}

export function DashboardPage({ anomalies, isConnected, stats, scanner, markets }: DashboardPageProps) {

  // Notification state stored in a ref to avoid re-renders
  const notifStateRef = useRef<NotificationState>({
    enabled: false,
    permission: 'default',
    minSeverity: 'HIGH',
  });
  const prevAnomalyCountRef = useRef(0);

  // Watch for new anomalies and send notifications
  useEffect(() => {
    const state = notifStateRef.current;
    if (!state.enabled || state.permission !== 'granted') {
      prevAnomalyCountRef.current = anomalies.length;
      return;
    }

    const SEVERITY_ORDER: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const minIdx = SEVERITY_ORDER.indexOf(state.minSeverity);

    if (anomalies.length > prevAnomalyCountRef.current) {
      const newOnes = anomalies.slice(0, anomalies.length - prevAnomalyCountRef.current);
      for (const a of newOnes) {
        const sevIdx = SEVERITY_ORDER.indexOf(a.severity);
        if (sevIdx >= minIdx) {
          new Notification(`PolyScreener — ${a.severity}`, {
            body: a.question,
            icon: '/favicon.svg',
          });
          if (a.severity === 'CRITICAL') playBeep();
        }
      }
    }
    prevAnomalyCountRef.current = anomalies.length;
  }, [anomalies]);

  async function requestNotifications() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    notifStateRef.current.permission = perm;
    if (perm === 'granted') notifStateRef.current.enabled = true;
  }

  return (
    <div className="gap-6 lg:grid lg:grid-cols-[1fr_360px]">
      <AnomalyFeed anomalies={anomalies} isConnected={isConnected} />
      <Sidebar
        stats={stats}
        scanner={scanner}
        markets={markets}
        recentAnomalies={anomalies.slice(0, 5)}
        onRequestNotifications={requestNotifications}
      />
    </div>
  );
}
