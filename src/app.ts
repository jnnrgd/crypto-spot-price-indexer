import { serverPort } from './infrastructure/configs/AppConfig';
import { app } from './infrastructure/http/HttpServer';
import { logger } from './infrastructure/logging/logger';


logger.info('Starting application');

const server = app
  .listen(serverPort, () => {
    logger.info(`Server running on http://localhost:${serverPort}`);
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
