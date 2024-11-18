import { CalculatePriceIndex } from '../../../src/core/usecases/CalculatePriceIndex';
import { ConnectorRegistry } from '../../../src/adapters/connectors/ConnectorRegistry';
import { ExchangeConnector } from '../../../src/core/ports/ExchangeConnector';
import { PricesNotAvailableError } from '../../../src/core/usecases/errors';

describe('CalculatePriceIndex', () => {
  let priceIndexCalculator: CalculatePriceIndex;
  let mockConnectors: jest.Mocked<ExchangeConnector[]>;

  beforeEach(() => {
    mockConnectors = [
      {
        fetchOrderBook: jest.fn().mockResolvedValue({ bid: 90000, ask: 90100 })
      },
      {
        fetchOrderBook: jest.fn().mockResolvedValue({ bid: 89900, ask: 90000 })
      },
      {
        fetchOrderBook: jest.fn().mockResolvedValue({ bid: 90050, ask: 90150 })
      }
    ] as any;

    jest.spyOn(ConnectorRegistry, 'getAllConnectors').mockReturnValue(mockConnectors);

    priceIndexCalculator = new CalculatePriceIndex();
  });

  describe('mean', () => {
    it('should calculate the mean price correctly', async () => {
      const pair = 'BTC/USDT';
      const result = await priceIndexCalculator.mean(pair);

      expect(result.pair).toBe(pair);
      expect(result.price).toBeCloseTo(90033.33);
      expect(result.timestamp).toBeDefined();
    });

    it('should throw PricesNotAvailableError when no prices', async () => {
      mockConnectors.forEach(connector =>
        (connector.fetchOrderBook as jest.Mock).mockRejectedValue(new PricesNotAvailableError())
      );

      await expect(priceIndexCalculator.mean('BTC/USDT'))
        .rejects.toThrow(PricesNotAvailableError);
    });
  });

  describe('median', () => {
    it('should calculate the median price correctly for odd number of prices', async () => {
      const pair = 'BTC/USDT';
      const result = await priceIndexCalculator.median(pair);

      // Sorted mid-prices: 89950, 90050, 90100
      // Median should be 90050
      expect(result.pair).toBe(pair);
      expect(result.price).toBeCloseTo(90050);
      expect(result.timestamp).toBeDefined();
    });

    it('should calculate the median price correctly for even number of prices', async () => {
      mockConnectors.push({
        fetchOrderBook: jest.fn().mockResolvedValue({ bid: 90200, ask: 90300 })
      } as any);

      const pair = 'BTC/USDT';
      const result = await priceIndexCalculator.median(pair);

      // Sorted mid-prices: 89950, 90050, 90100, 90250
      // Median should be 90075
      expect(result.pair).toBe(pair);
      expect(result.price).toBeCloseTo(90075);
      expect(result.timestamp).toBeDefined();
    });

    it('should throw PricesNotAvailableError when no prices', async () => {
      mockConnectors.forEach(connector =>
        (connector.fetchOrderBook as jest.Mock).mockRejectedValue(new PricesNotAvailableError())
      );

      await expect(priceIndexCalculator.median('BTC/USDT'))
        .rejects.toThrow(PricesNotAvailableError);
    });
  });
});