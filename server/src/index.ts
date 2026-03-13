import { config } from './config.js';
import { logger } from './utils/logger.js';
import { createApp } from './api/server.js';
import { startScanner, stopScanner } from './services/scanner.js';
import { stopWebSocket } from './services/websocket.js';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info({ port: config.port }, 'PolyScreener server started');
  startScanner();
});

function shutdown(): void {
  logger.info('Shutting down...');
  stopScanner();
  stopWebSocket();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
