import { Router, type Request, type Response } from 'express';
import { config } from '../../config.js';

const router = Router();

router.get('/config', (_req: Request, res: Response) => {
  res.json({
    appName: 'PolyScreener',
    builderCode: config.builderCode,
  });
});

export default router;
