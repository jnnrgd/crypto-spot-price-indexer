import { KrakenConnector } from '../../../src/adapters/connectors/Kraken/KrakenConnector';
import { HttpClient } from '../../../src/infrastructure/http/HttpClient';
import { Pair } from '../../../src/core/domain/Pair';

jest.mock('../../../src/infrastructure/http/HttpClient');
jest.mock('../../../src/infrastructure/logging/logger');

describe('KrakenConnector', () => {
  let krakenConnector: KrakenConnector;
  let httpClientMock: jest.Mocked<HttpClient>;

  beforeEach(() => {
    httpClientMock = new HttpClient('https://api.kraken.com/0/public/') as jest.Mocked<HttpClient>;
    krakenConnector = new KrakenConnector();
    (krakenConnector as any).httpClient = httpClientMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect successfully when Kraken is online', async () => {
      httpClientMock.get.mockResolvedValue({
        error: [],
        result: { status: 'online' }
      });

      await expect(krakenConnector.connect()).resolves.not.toThrow();
    });

    it('should throw an error when Kraken is not online', async () => {
      httpClientMock.get.mockResolvedValue({
        error: [],
        result: { status: 'offline' }
      });

      await expect(krakenConnector.connect()).rejects.toThrow('Kraken is not online');
    });

    it('should throw an error when there are errors in the response', async () => {
      httpClientMock.get.mockResolvedValue({
        error: ['Some error'],
        result: { status: 'online' }
      });

      await expect(krakenConnector.connect()).rejects.toThrow('Some error');
    });
  });

  describe('isConnected', () => {
    it('should return true when Kraken is online', async () => {
      httpClientMock.get.mockResolvedValue({
        error: [],
        result: { status: 'online' }
      });

      await expect(krakenConnector.isConnected()).resolves.toBe(true);
    });

    it('should return false when Kraken is not online', async () => {
      httpClientMock.get.mockResolvedValue({
        error: [],
        result: { status: 'offline' }
      });

      await expect(krakenConnector.isConnected()).resolves.toBe(false);
    });

    it('should return false when there are errors in the response', async () => {
      httpClientMock.get.mockResolvedValue({
        error: ['Some error'],
        result: { status: 'online' }
      });

      await expect(krakenConnector.isConnected()).resolves.toBe(false);
    });
  });

  describe('fetchTopOfBook', () => {
    it('should return top of book data when response is successful', async () => {
      const pair: Pair = { asset: 'BTC', quote: 'USD' };
      httpClientMock.get.mockResolvedValue({
        error: [],
        result: {
          BTCUSD: {
            bids: [['97000.00', '1', 12345]],
            asks: [['97001.00', '1', 12345]],
          }
        }
      });

      const topOfBook = await krakenConnector.fetchTopOfBook(pair);
      expect(topOfBook).toEqual({ bid: 97000.0, ask: 97001.0 });
    });

    it('should return null when there are errors in the response', async () => {
      const pair: Pair = { asset: 'BTC', quote: 'USD' };
      httpClientMock.get.mockResolvedValue({
        error: ['Some error'],
        result: {}
      });

      const topOfBook = await krakenConnector.fetchTopOfBook(pair);
      expect(topOfBook).toBeNull();
    });
  });

  describe('getName', () => {
    it('should return the name of the connector', () => {
      expect(krakenConnector.getName()).toBe('KrakenConnector');
    });
  });
});