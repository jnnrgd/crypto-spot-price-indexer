import { HuobiConnector } from '../../../src/adapters/connectors/Huobi/HuobiConnector';
import { HttpClient } from '../../../src/infrastructure/http/HttpClient';
import { Pair } from '../../../src/core/domain/Pair';
import { TopOfBook } from '../../../src/core/domain/TopOfBook';
import { MarketStatus, SystemStatusResponse, OrderBookResponse } from '../../../src/adapters/connectors/Huobi/dtos';

jest.mock('../../../src/infrastructure/http/HttpClient');

describe('HuobiConnector', () => {
  let huobiConnector: HuobiConnector;
  let httpClientMock: jest.Mocked<HttpClient>;

  beforeEach(() => {
    httpClientMock = new HttpClient('') as jest.Mocked<HttpClient>;
    huobiConnector = new HuobiConnector();
    (huobiConnector as any).httpClient = httpClientMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should throw an error if the market status is not normal', async () => {
      httpClientMock.get.mockResolvedValueOnce({
        code: 200,
        data: { marketStatus: MarketStatus.Halted },
      } as SystemStatusResponse);

      await expect(huobiConnector.connect()).rejects.toThrow('Huobi is not online');
    });

    it('should not throw an error if the market status is normal', async () => {
      httpClientMock.get.mockResolvedValueOnce({
        code: 200,
        data: { marketStatus: MarketStatus.Normal },
      } as SystemStatusResponse);

      await expect(huobiConnector.connect()).resolves.not.toThrow();
    });

    it('should throw an error if the response code is not 200', async () => {
      httpClientMock.get.mockResolvedValueOnce({
        code: 500,
        message: 'Internal Server Error',
      } as SystemStatusResponse);

      await expect(huobiConnector.connect()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('isConnected', () => {
    it('should return true if the market status is normal', async () => {
      httpClientMock.get.mockResolvedValueOnce({
        code: 200,
        data: { marketStatus: MarketStatus.Normal },
      } as SystemStatusResponse);

      await expect(huobiConnector.isConnected()).resolves.toBe(true);
    });

    it('should return false if the market status is not normal', async () => {
      httpClientMock.get.mockResolvedValueOnce({
        code: 200,
        data: { marketStatus: MarketStatus.Halted },
      } as SystemStatusResponse);

      await expect(huobiConnector.isConnected()).resolves.toBe(false);
    });

    it('should return false if the response code is not 200', async () => {
      httpClientMock.get.mockResolvedValueOnce({
        code: 500,
        message: 'Internal Server Error',
      } as SystemStatusResponse);

      await expect(huobiConnector.isConnected()).resolves.toBe(false);
    });
  });

  describe('fetchTopOfBook', () => {
    it('should return the top of book if the response is ok', async () => {
      const pair: Pair = { asset: 'BTC', quote: 'USDT' };
      // 
      const response: OrderBookResponse = {
        status: 'ok',
        ch: 'market.btcusdt.depth.step0',
        ts: 1620000000000,
        tick: {
          ts: 1620000000000,
          version: 123456789,
          bids: [[96391.15, 0.219988], [96391.12, 2.0E-4], [96390.91, 2.0E-4], [96390.86, 2.0E-4], [96390.77, 2.0E-4]],
          asks: [[96391.16, 0.6682310659994132], [96392.15, 0.005044], [96392.87, 0.010407], [96392.92, 0.005508], [96395.98, 0.002656]],
        },
      };
      httpClientMock.get.mockResolvedValueOnce(response);

      const topOfBook: TopOfBook | null = await huobiConnector.fetchTopOfBook(pair);

      expect(topOfBook).toEqual({ bid: 96391.15, ask: 96391.16 });
    });

    it('should return null if the response status is not ok', async () => {
      const pair: Pair = { asset: 'BTC', quote: 'USDT' };
      const response: OrderBookResponse = {
        status: 'error',
        ch: 'market.btcusdt.depth.step0',
        ts: 1620000000000,
        tick: {
          ts: 1620000000000,
          version: 123456789,
          bids: [[96391.15, 0.219988], [96391.12, 2.0E-4], [96390.91, 2.0E-4], [96390.86, 2.0E-4], [96390.77, 2.0E-4]],
          asks: [[96391.16, 0.6682310659994132], [96392.15, 0.005044], [96392.87, 0.010407], [96392.92, 0.005508], [96395.98, 0.002656]],
        },
      };
      httpClientMock.get.mockResolvedValueOnce(response);

      const topOfBook: TopOfBook | null = await huobiConnector.fetchTopOfBook(pair);

      expect(topOfBook).toBeNull();
    });

    it('should return null if there are no valid bids or asks', async () => {
      const pair: Pair = { asset: 'BTC', quote: 'USDT' };
      const response: OrderBookResponse = {
        status: 'ok',
        ch: 'market.btcusdt.depth.step0',
        ts: 1620000000000,
        tick: {
          ts: 1620000000000,
          version: 123456789,
          bids: [[96391.15, 0], [96391.12, 0], [96390.91, 0], [96390.86, 0], [96390.77, 0]],
          asks: [[96391.16, 0], [96392.15, 0], [96392.87, 0], [96392.92, 0], [96395.98, 0]],
        },
      };
      httpClientMock.get.mockResolvedValueOnce(response);

      const topOfBook: TopOfBook | null = await huobiConnector.fetchTopOfBook(pair);

      expect(topOfBook).toBeNull();
    });
  });

  describe('getName', () => {
    it('should return the name of the connector', () => {
      expect(huobiConnector.getName()).toBe('HuobiConnector');
    });
  });
});