import { ExchangeConnector } from './ExchangeConnector';

export interface ConnectorRegistryPort {
  getConnectors(): ExchangeConnector[];
}
