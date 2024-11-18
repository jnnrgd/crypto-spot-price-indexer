import { CalculatePriceIndex } from '../../../src/core/usecases/CalculatePriceIndex';
import { ConnectorRegistry } from '../../../src/adapters/connectors/ConnectorRegistry';
import { ExchangeConnector } from '../../../src/core/ports/ExchangeConnector';
import { Pair } from '../../../src/core/domain/Pair';
import { PricesNotAvailableError } from '../../../src/core/domain/errors/PriceNotAvailableError';

describe('CalculatePriceIndex', () => {
  let priceIndexCalculator: CalculatePriceIndex;
  let mockConnectors: jest.Mocked<ExchangeConnector[]>;
  let registry = new ConnectorRegistry();
  const pair: Pair = {
    asset: 'BTC',
    quote: 'USDT',
  };
  beforeEach(() => {
    mockConnectors = [
      {
        fetchOrderBook: jest.fn().mockResolvedValue({ bid: 90000, ask: 90100 },)
      },
      {
        fetchOrderBook: jest.fn().mockResolvedValue({ bid: 89900, ask: 90000 })
      },
      {
        fetchOrderBook: jest.fn().mockResolvedValue({ bid: 90050, ask: 90150 })
      }
    ] as any;

    jest.spyOn(registry, 'getConnectors').mockReturnValue(mockConnectors);

    priceIndexCalculator = new CalculatePriceIndex(registry);
  });

  describe('mean', () => {
    it('should calculate the mean price correctly', async () => {
      const result = await priceIndexCalculator.mean(pair);

      expect(result.pair).toBe(pair);
      expect(result.price).toBeCloseTo(90033.33);
      expect(result.timestamp).toBeDefined();
    });

    it('should throw PricesNotAvailableError when no prices', async () => {
      const calculatePriceIndex = new CalculatePriceIndex(new ConnectorRegistry());
      await expect(calculatePriceIndex.mean(pair))
        .rejects.toThrow(PricesNotAvailableError);
    });
  });

  describe('median', () => {
    it('should calculate the median price correctly for odd number of prices', async () => {
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

      const result = await priceIndexCalculator.median(pair);

      // Sorted mid-prices: 89950, 90050, 90100, 90250
      // Median should be 90075
      expect(result.pair).toBe(pair);
      expect(result.price).toBeCloseTo(90075);
      expect(result.timestamp).toBeDefined();
    });

    it('should throw PricesNotAvailableError when no prices', async () => {
      const calculatePriceIndex = new CalculatePriceIndex(new ConnectorRegistry());
      await expect(calculatePriceIndex.median(pair))
        .rejects.toThrow(PricesNotAvailableError);
    });
  });
});