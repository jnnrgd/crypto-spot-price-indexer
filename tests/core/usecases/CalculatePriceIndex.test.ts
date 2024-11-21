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
        fetchTopOfBook: jest.fn().mockResolvedValue({ bid: 90000, ask: 90100 }),
        isConnected: jest.fn().mockResolvedValue(true),
        connect: jest.fn().mockResolvedValue(undefined),
      },
      {
        fetchTopOfBook: jest.fn().mockResolvedValue({ bid: 89900, ask: 90000 }),
        isConnected: jest.fn().mockResolvedValue(true),
        connect: jest.fn().mockResolvedValue(undefined),
      },
      {
        fetchTopOfBook: jest.fn().mockResolvedValue({ bid: 90050, ask: 90150 }),
        isConnected: jest.fn().mockResolvedValue(true),
        connect: jest.fn().mockResolvedValue(undefined),
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
        fetchTopOfBook: jest.fn().mockResolvedValue({ bid: 90200, ask: 90300 }),
        isConnected: jest.fn().mockResolvedValue(true),
        connect: jest.fn().mockResolvedValue(undefined),
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

  describe('getPrices', () => {
    it('should return prices from all connectors', async () => {
      const prices = await priceIndexCalculator['getPrices'](pair);

      expect(prices).toEqual([90050, 89950, 90100]);
    });

    it('should connect to disconnected connectors', async () => {
      (mockConnectors[0].isConnected as jest.Mock).mockResolvedValue(false);

      await priceIndexCalculator['getPrices'](pair);

      expect(mockConnectors[0].connect).toHaveBeenCalled();
    });

    it('should throw if all fetchTopOfBook return null', async () => {
      mockConnectors.forEach((connector) => {
        (connector.fetchTopOfBook as jest.Mock).mockResolvedValue(null);
      });

      await expect(priceIndexCalculator['getPrices'](pair)).rejects.toThrow(PricesNotAvailableError);
    });
  });
});