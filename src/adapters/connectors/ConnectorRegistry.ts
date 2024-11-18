import { ConnectorRegistryPort } from '../../core/ports/ConnectorRegistryPort';
import { ExchangeConnector } from '../../core/ports/ExchangeConnector';
import { logger } from '../../infrastructure/configs/logger';

export class ConnectorRegistry implements ConnectorRegistryPort {
  private connectors: Map<string, any> = new Map();
  constructor() { }

  public register(connector: ExchangeConnector) {
    this.connectors.set(connector.getName(), connector);
    logger.info(`Registered connector ${connector.getName}`);
  }

  public getConnector(name: string): ExchangeConnector | undefined {
    return this.connectors.get(name);
  }

  public getConnectors(): ExchangeConnector[] {
    return Array.from(this.connectors.values());
  }

  public initialize() {
    // logger.info('Initializing connectors');
    // this.register(new BinanceConnector());
  }
}