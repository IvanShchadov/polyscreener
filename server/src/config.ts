import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3333', 10),
  gammaApiUrl: process.env.GAMMA_API_URL || 'https://gamma-api.polymarket.com',
  clobApiUrl: process.env.CLOB_API_URL || 'https://clob.polymarket.com',
  clobWsUrl: process.env.CLOB_WS_URL || 'wss://ws-subscriptions-clob.polymarket.com/ws/',
  scanIntervalMs: parseInt(process.env.SCAN_INTERVAL_MS || '30000', 10),
  priceChangeThreshold: parseFloat(process.env.PRICE_CHANGE_THRESHOLD || '0.05'),
  volumeSpikeMultiplier: parseFloat(process.env.VOLUME_SPIKE_MULTIPLIER || '3'),
  whaleTradeMinSize: parseFloat(process.env.WHALE_TRADE_MIN_SIZE || '5000'),
  maxMarketsToTrack: parseInt(process.env.MAX_MARKETS_TO_TRACK || '500', 10),
  builderCode: process.env.POLYMARKET_BUILDER_CODE || '',
};
