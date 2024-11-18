import { ConnectorRegistry } from './adapters/connectors/ConnectorRegistry';
import { app } from './infrastructure/configs/HttpServer';
import { logger } from './infrastructure/configs/logger';

const PORT = process.env.PORT || 3000;

logger.info('Starting application');

const connectorRegistry = new ConnectorRegistry();
connectorRegistry.initialize();

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});
