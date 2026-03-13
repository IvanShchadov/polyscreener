import { Router, type Request, type Response } from 'express';
import { getAnomalies, getAnomalyStats, getPriceHistory } from '../../services/anomaly.js';
import { registerSSEClient } from '../../services/scanner.js';
import type { AnomalyType, Severity } from '../../types/index.js';

const router = Router();

router.get('/anomalies', (req: Request, res: Response) => {
  const type = req.query.type as AnomalyType | undefined;
  const severity = req.query.severity as Severity | undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

  const anomalies = getAnomalies({ type, severity, limit });
  res.json(anomalies);
});

router.get('/anomalies/stats', (_req: Request, res: Response) => {
  res.json(getAnomalyStats());
});

router.get('/anomalies/feed', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send init with latest 20
  const initial = getAnomalies({ limit: 20 });
  res.write(`data: ${JSON.stringify({ type: 'init', anomalies: initial })}\n\n`);

  // Register for updates
  const unregister = registerSSEClient((newAnomalies) => {
    res.write(
      `data: ${JSON.stringify({ type: 'update', anomalies: newAnomalies })}\n\n`,
    );
  });

  // Keep-alive every 30 seconds
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30_000);

  req.on('close', () => {
    unregister();
    clearInterval(keepAlive);
  });
});

router.get('/history/:conditionId', (req: Request, res: Response) => {
  const conditionId = req.params.conditionId as string;
  const history = getPriceHistory(conditionId);
  if (!history) {
    res.status(404).json({ error: 'No history found' });
    return;
  }
  res.json(history);
});

export default router;
