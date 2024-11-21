import { app } from './infrastructure/http/HttpServer';
import { logger } from './infrastructure/logging/logger';

const PORT = process.env.PORT || 3000;

logger.info('Starting application');

const server = app
  .listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  })
  .on('error', (err) => {
    logger.error(err);
  });

process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});
