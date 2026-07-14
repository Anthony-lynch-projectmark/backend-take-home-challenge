import { NextFunction, Request, Response } from 'express';
import { logger } from '../logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error({ err, method: req.method, path: req.path }, 'unhandled error');
  res.status(500).json({ error: 'internal server error' });
}
