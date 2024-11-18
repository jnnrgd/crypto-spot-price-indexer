import { ExchangeConnector } from '../../core/ports/ExchangeConnector';
import { logger } from '../../infrastructure/configs/logger';

export class ConnectorRegistry {
  private static connectors: Map<string, any> = new Map();

  static register(connector: ExchangeConnector) {
    this.connectors.set(connector.getName(), connector);
    logger.info(`Registered connector ${connector.getName}`);
  }

  static getConnector(name: string): ExchangeConnector | undefined {
    return this.connectors.get(name);
  }

  static getAllConnectors(): ExchangeConnector[] {
    return Array.from(this.connectors.values());
  }

  static initialize() {
    logger.info('Initializing connectors');
    // this.register(new BinanceConnector());
  }
}