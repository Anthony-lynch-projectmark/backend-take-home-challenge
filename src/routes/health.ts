import { Router } from 'express';
import { config } from '../config';

const router = Router();

router.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

export default router;
