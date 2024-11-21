import { PricesNotAvailableError } from '../domain/errors/PriceNotAvailableError';
import { Pair } from '../domain/Pair';
import { PriceIndex } from '../domain/PriceIndex';
import { ConnectorRegistryPort } from '../ports/ConnectorRegistryPort';

export class CalculatePriceIndex {
  private connectorRegistry: ConnectorRegistryPort;
  constructor(connectorRegistry: ConnectorRegistryPort) {
    this.connectorRegistry = connectorRegistry;
  }

  private async getPrices(pair: Pair): Promise<number[]> {
    const prices = (await Promise.all(
      this.connectorRegistry.getConnectors().map(async (connector) => {
        if (!await connector.isConnected()) {
          await connector.connect();
        }
        const orderBook = await connector.fetchTopOfBook(pair);
        return orderBook ? (orderBook.bid + orderBook.ask) / 2 : null;
      })
    )).filter((price): price is number => price !== null);

    if (prices.length === 0) {
      throw new PricesNotAvailableError();
    }
    return prices;
  }

  async mean(pair: Pair): Promise<PriceIndex> {
    const prices = await this.getPrices(pair);

    const averagePrice =
      prices.reduce((acc, price) => acc + price, 0) / prices.length;

    return {
      pair,
      price: averagePrice,
      timestamp: Date.now(),
    };
  }

  async median(pair: Pair): Promise<PriceIndex> {
    const prices = await this.getPrices(pair);

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sortedPrices.length / 2);

    const medianPrice =
      sortedPrices.length % 2 !== 0
        ? sortedPrices[mid]
        : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;

    return {
      pair,
      price: medianPrice,
      timestamp: Date.now(),
    };
  }
}
