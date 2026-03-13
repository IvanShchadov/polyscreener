import WebSocket from 'ws';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { addWhaleAnomaly } from './anomaly.js';

let ws: WebSocket | null = null;
let subscribedAssets = new Set<string>();
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let onWhaleCallback: ((anomaly: NonNullable<ReturnType<typeof addWhaleAnomaly>>) => void) | null = null;

export function setWhaleCallback(
  cb: (anomaly: NonNullable<ReturnType<typeof addWhaleAnomaly>>) => void,
): void {
  onWhaleCallback = cb;
}

function connect(): void {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  logger.info('Connecting to CLOB WebSocket...');
  ws = new WebSocket(config.clobWsUrl);

  ws.on('open', () => {
    logger.info('CLOB WebSocket connected');
    // Resubscribe to all assets
    for (const assetId of subscribedAssets) {
      sendSubscribe(assetId);
    }
  });

  ws.on('message', (data: WebSocket.Data) => {
    try {
      const msg = JSON.parse(data.toString());
      handleMessage(msg);
    } catch {
      // ignore parse errors
    }
  });

  ws.on('close', () => {
    logger.warn('CLOB WebSocket closed, reconnecting in 5s...');
    scheduleReconnect();
  });

  ws.on('error', (err) => {
    logger.error({ err }, 'CLOB WebSocket error');
    ws?.close();
  });
}

function scheduleReconnect(): void {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 5_000);
}

function sendSubscribe(assetId: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      type: 'subscribe',
      channel: 'trades',
      assets_ids: [assetId],
    }),
  );
}

function sendUnsubscribe(assetId: string): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(
    JSON.stringify({
      type: 'unsubscribe',
      channel: 'trades',
      assets_ids: [assetId],
    }),
  );
}

function handleMessage(msg: Record<string, unknown>): void {
  // CLOB WS sends trade events
  if (msg.event_type !== 'trade' && msg.type !== 'trade') return;

  const assetId = (msg.asset_id as string) || '';
  const price = parseFloat((msg.price as string) || '0');
  const size = parseFloat((msg.size as string) || '0');
  const side = (msg.side as string) || 'unknown';

  if (size < config.whaleTradeMinSize) return;

  logger.info({ assetId, size, price, side }, 'Whale trade detected via WS');

  // Find condition ID from asset ID — we use the subscribed set mapping
  const conditionId = assetToCondition.get(assetId);
  if (!conditionId) return;

  const anomaly = addWhaleAnomaly(conditionId, size, price, side);
  if (anomaly && onWhaleCallback) {
    onWhaleCallback(anomaly);
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

  // Unsubscribe removed
  for (const old of subscribedAssets) {
    if (!newAssets.has(old)) {
      sendUnsubscribe(old);
    }
  }

  // Subscribe new
  for (const n of newAssets) {
    if (!subscribedAssets.has(n)) {
      sendSubscribe(n);
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
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
}
