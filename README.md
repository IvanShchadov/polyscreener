# PolyScreener

**AI-powered anomaly screener for Polymarket prediction markets.**

Built for the [Polymarket Builders Program](https://polymarket.com/builders) — grants from $100 to $75,000 with weekly rewards based on trading volume.

PolyScreener monitors the top prediction markets on Polymarket in real-time, detects anomalies (price spikes, whale trades, volume surges, wide spreads), and surfaces them through a sleek trading-terminal dashboard.

## Anomaly Types

| Type | Trigger | Severity Logic |
|------|---------|----------------|
| **PRICE_SPIKE** | Price change >= 5% between scans | >= 20% CRITICAL, >= 12% HIGH, >= 7% MEDIUM, else LOW |
| **VOLUME_SURGE** | Volume > 3x rolling average | Always MEDIUM |
| **SPREAD_ANOMALY** | Spread > 10 cents | > 20c HIGH, else MEDIUM |
| **WHALE_TRADE** | Single trade >= $5,000 (WebSocket) | >= $50K CRITICAL, >= $20K HIGH, >= $10K MEDIUM, else LOW |
| **CROSS_PLATFORM_ARB** | Price diff vs Kalshi >= 3 cents | >= 10% CRITICAL, >= 7% HIGH, >= 5% MEDIUM, else LOW |
| **NEW_MARKET_HOT** | New market with > $50K vol & > $10K liq | Always LOW |

Each anomaly has a 4-hour TTL. Deduplication: same type + market within a 5-minute window = one anomaly.

## Architecture

```
                          +-----------------+
                          |   Gamma API     |
                          |  (markets data) |
                          +--------+--------+
                                   |
                                   v
+----------+    SSE     +---------+----------+    WebSocket    +------------+
|  React   | <--------- |    Express Server   | <------------- | CLOB WS    |
|  Client  |            |                     |                | (trades)   |
|  (Vite)  | ---------> |  Scanner (30s loop) |                +------------+
+----------+   /api/*   |  Anomaly Engine     |
                        |  Price History      |
                        +---------------------+
```

**Scanner loop (every 30s):**
1. Fetch top 500 markets from Gamma API
2. Run anomaly detection (6 types)
3. Update WebSocket subscriptions (top 100 by volume)
4. Broadcast new anomalies via SSE to connected clients

## Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Setup

```bash
# Clone the repo
git clone https://github.com/IvanShchadov/polyscreener.git
cd polyscreener

# Install server dependencies
cd server
cp .env.example .env
npm install

# Install client dependencies
cd ../client
npm install

# Install root dependencies
cd ..
npm install

# Start development (both server + client)
npm run dev
```

Server runs on `http://localhost:3333`, client on `http://localhost:5173` (proxied).

### Production Build

```bash
npm run build
npm start   # serves client/dist as static files from Express
```

## API Reference

### Anomalies

```
GET /api/anomalies?type=PRICE_SPIKE&severity=HIGH&limit=50
GET /api/anomalies/stats
GET /api/anomalies/feed          → SSE stream
GET /api/history/:conditionId    → price history
```

### Markets

```
GET /api/markets?q=bitcoin&tag=crypto&sort=volume&limit=50&offset=0
GET /api/markets/:conditionId
GET /api/markets/scanner/status
```

### Health

```
GET /api/health
```

### SSE Feed

Connect to `/api/anomalies/feed` via `EventSource`. On connect, receives an `init` event with the latest 20 anomalies. Subsequent `update` events are sent when new anomalies are detected.

```json
{ "type": "init", "anomalies": [...] }
{ "type": "update", "anomalies": [...] }
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | TypeScript, Node.js, Express |
| Real-time | SSE (server → client), WebSocket (CLOB → server) |
| Frontend | React 18, Vite, TailwindCSS |
| Fonts | Outfit (UI), JetBrains Mono (numbers) |
| Logging | Pino |
| APIs | Polymarket Gamma API, CLOB API, CLOB WebSocket |

## Roadmap

- **Phase 1** (current): Core screener — anomaly detection, dashboard, SSE feed
- **Phase 2**: Telegram bot — instant alerts for CRITICAL/HIGH anomalies
- **Phase 3**: Kalshi arbitrage — cross-platform price comparison and alerts
- **Phase 4**: AI layer — LLM-powered anomaly explanations and market summaries
- **Phase 5**: Trading integration — one-click trade execution from the dashboard

## License

MIT
