import WebSocket from 'ws';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { addWhaleAnomaly } from './anomaly.js';

let ws: WebSocket | null = null;
let subscribedAssets = new Set<string>();
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 8;
const BASE_RECONNECT_MS = 5_000;

let onWhaleCallback: ((anomaly: NonNullable<ReturnType<typeof addWhaleAnomaly>>) => void) | null = null;

export function setWhaleCallback(
  cb: (anomaly: NonNullable<ReturnType<typeof addWhaleAnomaly>>) => void,
): void {
  onWhaleCallback = cb;
}

function getWsUrl(): string {
  const base = config.clobWsUrl.replace(/\/+$/, '');
  if (base.endsWith('/ws/market')) return base;
  if (base.endsWith('/ws')) return base + '/market';
  return base + '/ws/market';
}

function connect(): void {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.warn(
      { attempts: reconnectAttempts },
      'CLOB WebSocket: max reconnect attempts reached. Whale detection via WS disabled.',
    );
    return;
  }

  const wsUrl = getWsUrl();
  logger.info({ url: wsUrl, attempt: reconnectAttempts + 1 }, 'Connecting to CLOB WebSocket');

  try {
    ws = new WebSocket(wsUrl);
  } catch (err) {
    logger.warn({ err }, 'Failed to create WebSocket');
    scheduleReconnect();
    return;
  }

  ws.on('open', () => {
    logger.info('CLOB WebSocket connected');
    reconnectAttempts = 0;

    // Initial handshake per Polymarket protocol
    ws!.send(JSON.stringify({ assets_ids: [], type: 'market' }));

    // Subscribe to all tracked assets in a single batch
    if (subscribedAssets.size > 0) {
      ws!.send(
        JSON.stringify({
          operation: 'subscribe',
          assets_ids: Array.from(subscribedAssets),
        }),
      );
      logger.info({ count: subscribedAssets.size }, 'Subscribed to WS assets');
    }
  });

  ws.on('message', (data: WebSocket.Data) => {
    try {
      const parsed = JSON.parse(data.toString());
      const msgs = Array.isArray(parsed) ? parsed : [parsed];
      for (const msg of msgs) {
        handleMessage(msg);
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on('close', () => {
    ws = null;
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      logger.warn('CLOB WebSocket closed');
      scheduleReconnect();
    }
  });

  ws.on('error', (err) => {
    logger.warn({ msg: err.message }, 'CLOB WebSocket error');
    ws?.close();
    ws = null;
  });
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;

  reconnectAttempts++;
  const delay = Math.min(BASE_RECONNECT_MS * Math.pow(2, reconnectAttempts - 1), 60_000);
  logger.info({ delayMs: delay, attempt: reconnectAttempts, max: MAX_RECONNECT_ATTEMPTS }, 'WS reconnect scheduled');

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

function handleMessage(msg: Record<string, unknown>): void {
  const eventType = msg.event_type as string | undefined;

  // last_trade_price events contain trade info for whale detection
  if (eventType === 'last_trade_price' || eventType === 'trade') {
    const assetId = (msg.asset_id as string) || '';
    const price = parseFloat(String(msg.price || '0'));
    const size = parseFloat(String(msg.size || '0'));
    const side = (msg.side as string) || 'unknown';

    if (size < config.whaleTradeMinSize) return;

    logger.info({ assetId, size, price, side }, 'Whale trade detected via WS');

    const conditionId = assetToCondition.get(assetId);
    if (!conditionId) return;

    const anomaly = addWhaleAnomaly(conditionId, size, price, side);
    if (anomaly && onWhaleCallback) {
      onWhaleCallback(anomaly);
    }
  }
}

// Mapping from asset (token) ID to condition ID
const assetToCondition = new Map<string, string>();

export function updateSubscriptions(
  markets: { conditionId: string; clobTokenIds: string[] }[],
): void {
  const newAssets = new Set<string>();
  const newMapping = new Map<string, string>();

  for (const m of markets) {
    for (const tokenId of m.clobTokenIds) {
      newAssets.add(tokenId);
      newMapping.set(tokenId, m.conditionId);
    }
  }

  const toSubscribe: string[] = [];
  const toUnsubscribe: string[] = [];

  for (const n of newAssets) {
    if (!subscribedAssets.has(n)) toSubscribe.push(n);
  }
  for (const old of subscribedAssets) {
    if (!newAssets.has(old)) toUnsubscribe.push(old);
  }

  if (ws && ws.readyState === WebSocket.OPEN) {
    if (toUnsubscribe.length > 0) {
      ws.send(JSON.stringify({ operation: 'unsubscribe', assets_ids: toUnsubscribe }));
    }
    if (toSubscribe.length > 0) {
      ws.send(JSON.stringify({ operation: 'subscribe', assets_ids: toSubscribe }));
    }
  }

  subscribedAssets = newAssets;
  assetToCondition.clear();
  for (const [k, v] of newMapping) {
    assetToCondition.set(k, v);
  }
}

export function startWebSocket(): void {
  connect();
}

export function stopWebSocket(): void {
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
}
