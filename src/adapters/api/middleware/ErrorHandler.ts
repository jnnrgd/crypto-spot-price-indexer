import { Request, Response, NextFunction } from 'express';
import { logger } from '../../../infrastructure/logging/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  logger.error(`Error occurred: ${err.message}`);
  logger.error(err.stack);

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
  });
}
