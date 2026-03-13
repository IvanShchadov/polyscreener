import { useState, useEffect, useRef, useCallback } from 'react';
import type { Anomaly, SSEMessage } from '../types';

export function useAnomalies() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const es = new EventSource('/api/anomalies/feed');
    esRef.current = es;

    es.onopen = () => setIsConnected(true);

    es.onmessage = (event) => {
      try {
        const msg: SSEMessage = JSON.parse(event.data);
        if (msg.type === 'init') {
          setAnomalies(msg.anomalies);
        } else if (msg.type === 'update') {
          setAnomalies((prev) => {
            const merged = [...msg.anomalies, ...prev];
            // Deduplicate by id, keep latest
            const seen = new Set<string>();
            return merged.filter((a) => {
              if (seen.has(a.id)) return false;
              seen.add(a.id);
              return true;
            });
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      esRef.current = null;
      // Reconnect after 5 seconds
      reconnectRef.current = setTimeout(connect, 5_000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  return { anomalies, isConnected };
}
