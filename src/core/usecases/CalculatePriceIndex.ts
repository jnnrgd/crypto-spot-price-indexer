import { ConnectorRegistry } from '../../adapters/connectors/ConnectorRegistry';
import { PriceIndex } from '../domain/PriceIndex';
import { ExchangeConnector } from '../ports/ExchangeConnector';
import { PricesNotAvailableError } from './errors';

export class CalculatePriceIndex {
  private connectors: ExchangeConnector[];
  constructor() {
    this.connectors = ConnectorRegistry.getAllConnectors();
  }

  async mean(pair: string): Promise<PriceIndex> {
    const prices = await Promise.all(
      this.connectors.map(async connector => {
        const orderBook = await connector.fetchOrderBook(pair);
        return (orderBook.bid + orderBook.ask) / 2;
      })
    );

    if (prices.length === 0) {
      throw new PricesNotAvailableError();
    }

    const averagePrice = prices.reduce((acc, price) => acc + price, 0) / prices.length;

    return {
      pair,
      price: averagePrice,
      timestamp: Date.now()
    };
  }

  async median(pair: string): Promise<PriceIndex> {
    const prices = await Promise.all(
      this.connectors.map(async connector => {
        const orderBook = await connector.fetchOrderBook(pair);
        return (orderBook.bid + orderBook.ask) / 2;
      })
    );

    if (prices.length === 0) {
      throw new PricesNotAvailableError();
    }

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sortedPrices.length / 2);

    const medianPrice = sortedPrices.length % 2 !== 0
      ? sortedPrices[mid]
      : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;

    return {
      pair,
      price: medianPrice,
      timestamp: Date.now()
    };
  }
}
