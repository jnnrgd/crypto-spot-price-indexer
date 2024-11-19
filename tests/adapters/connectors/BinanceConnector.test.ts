import { BinanceConnector } from '../../../src/adapters/connectors/Binance/BinanceConnector';
import { HttpClient } from '../../../src/infrastructure/http/HttpClient';
import { logger } from '../../../src/infrastructure/logging/logger';
import { WebsocketClient } from '../../../src/infrastructure/ws/WebsocketClient';

jest.mock('../../../src/infrastructure/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}));
jest.mock('../../../src/infrastructure/http/HttpClient');
jest.mock('../../../src/infrastructure/ws/WebsocketClient');

describe('BinanceConnector', () => {
  let binanceConnector: BinanceConnector;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockWsClient: jest.Mocked<WebsocketClient>;

  beforeEach(() => {
    mockHttpClient = new HttpClient('https://api.binance.com') as jest.Mocked<HttpClient>;
    mockWsClient = new WebsocketClient('wss://stream.binance.com:9443/ws') as jest.Mocked<WebsocketClient>;

    (HttpClient as jest.Mock).mockImplementation(() => mockHttpClient);
    (WebsocketClient as jest.Mock).mockImplementation(() => mockWsClient);

    binanceConnector = new BinanceConnector();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getName', () => {
    it('should return exchange name', () => {
      const result = binanceConnector.getName();

      expect(result).toBe(BinanceConnector.name);
    });
  });

  describe('connect', () => {
    it('should connect to websocket', async () => {
      const response = {
        lastUpdateId: 1,
        bids: [['1', '2']],
        asks: [['3', '4']],
      };
      mockHttpClient.get.mockResolvedValue(response);
      await binanceConnector.connect();

      expect(mockHttpClient.configure).toHaveBeenCalled();
      expect(mockWsClient.connect).toHaveBeenCalled();
      expect(mockWsClient.onMessage).toHaveBeenCalled();
      expect(mockWsClient.send).toHaveBeenCalled();
    });
  });

  describe('initializeTopOfBook', () => {
    it('should initialize top of book', async () => {
      const response = {
        lastUpdateId: 1,
        bids: [['1', '2']],
        asks: [['3', '4']],
      };
      mockHttpClient.get.mockResolvedValue(response);

      await binanceConnector['initializeTopOfBook']();

      expect(binanceConnector['lastUpdateId']).toBe(1);
      expect(binanceConnector['bestBid']).toEqual({ price: 1, quantity: 2 });
      expect(binanceConnector['bestAsk']).toEqual({ price: 3, quantity: 4 });
    });

    it('should throw error if request fails', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Request failed'));

      await expect(binanceConnector['initializeTopOfBook']()).rejects.toThrow('Request failed');
    });
  });

  describe('subscribeToChannel', () => {
    it('should subscribe to channel', async () => {
      await binanceConnector['subscribeToChannel']();

      expect(mockWsClient.send).toHaveBeenCalled();
    });
  });

  describe('unsubscribeFromChannel', () => {
    it('should unsubscribe from channel', async () => {
      await binanceConnector['unsubscribeFromChannel']();

      expect(mockWsClient.send).toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('should handle depth update', () => {
      const message = {
        e: 'depthUpdate',
        U: 1,
        u: 2,
        s: 'BTCUSDT',
        b: [['1', '2']],
        a: [['3', '4']],
      };

      binanceConnector['handleMessage'](Buffer.from(JSON.stringify(message)));

      expect(binanceConnector['lastUpdateId']).toBe(2);
      expect(binanceConnector['bestBid']).toEqual({ price: 1, quantity: 2 });
      expect(binanceConnector['bestAsk']).toEqual({ price: 3, quantity: 4 });
    });

    it('should handle sub/unsub successful', () => {
      const message = { result: null };

      binanceConnector['handleMessage'](Buffer.from(JSON.stringify(message)));

      expect(logger.debug).toHaveBeenCalledWith('Sub/Unsub successful');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from channel', async () => {
      await binanceConnector.disconnect();

      expect(mockWsClient.close).toHaveBeenCalled();
    });
  });

  describe('handleDepthUpdate', () => {
    it('should handle depth update', () => {
      const data = {
        U: 1,
        u: 2,
        s: 'BTCUSDT',
        b: [['1', '2'] as [string, string]],
        a: [['3', '4'] as [string, string]],
        e: 'depthUpdate',
        E: 0,
      };

      binanceConnector['handleDepthUpdate'](data);

      expect(binanceConnector['lastUpdateId']).toBe(2);
      expect(binanceConnector['bestBid']).toEqual({ price: 1, quantity: 2 });
      expect(binanceConnector['bestAsk']).toEqual({ price: 3, quantity: 4 });
    });

    it('should not update if u <= lastUpdateId', () => {
      binanceConnector['lastUpdateId'] = 2;
      const data = {
        U: 1,
        u: 2,
        s: 'BTCUSDT',
        b: [['1', '2'] as [string, string]],
        a: [['3', '4'] as [string, string]],
        e: 'depthUpdate',
        E: 0,
      };

      binanceConnector['handleDepthUpdate'](data);

      expect(binanceConnector['lastUpdateId']).toBe(2);
      expect(binanceConnector['bestBid']).toBeNull();
      expect(binanceConnector['bestAsk']).toBeNull();
    });

    it('should not update if U > lastUpdateId + 1', () => {
      binanceConnector['lastUpdateId'] = 1;
      const data = {
        U: 3,
        u: 2,
        s: 'BTCUSDT',
        b: [['1', '2'] as [string, string]],
        a: [['3', '4'] as [string, string]],
        e: 'depthUpdate',
        E: 0,
      };

      binanceConnector['handleDepthUpdate'](data);

      expect(binanceConnector['lastUpdateId']).toBe(1);
      expect(binanceConnector['bestBid']).toBeNull();
      expect(binanceConnector['bestAsk']).toBeNull();
    });
  });

  describe('updateBestBid', () => {
    it('should update best bid to null if same best bid has quantity 0', () => {
      binanceConnector['bestBid'] = { price: 1, quantity: 2 };

      binanceConnector['updateBestBid']([['1', '0'] as [string, string]]);

      expect(binanceConnector['bestBid']).toBeNull();
    });

    it('should update best bid if price is higher', () => {
      binanceConnector['bestBid'] = { price: 1, quantity: 2 };

      binanceConnector['updateBestBid']([['2', '3'] as [string, string]]);

      expect(binanceConnector['bestBid']).toEqual({ price: 2, quantity: 3 });
    });

    it('should not update best bid if price is lower', () => {
      binanceConnector['bestBid'] = { price: 2, quantity: 3 };

      binanceConnector['updateBestBid']([['1', '2'] as [string, string]]);

      expect(binanceConnector['bestBid']).toEqual({ price: 2, quantity: 3 });
    });
  });

  describe('updateBestAsk', () => {
    it('should update best ask to null if same best ask has quantity 0', () => {
      binanceConnector['bestAsk'] = { price: 1, quantity: 2 };

      binanceConnector['updateBestAsk']([['1', '0'] as [string, string]]);

      expect(binanceConnector['bestAsk']).toBeNull();
    });

    it('should update best ask if price is lower', () => {
      binanceConnector['bestAsk'] = { price: 2, quantity: 3 };

      binanceConnector['updateBestAsk']([['1', '2'] as [string, string]]);

      expect(binanceConnector['bestAsk']).toEqual({ price: 1, quantity: 2 });
    });

    it('should not update best ask if price is higher', () => {
      binanceConnector['bestAsk'] = { price: 1, quantity: 2 };

      binanceConnector['updateBestAsk']([['2', '3'] as [string, string]]);

      expect(binanceConnector['bestAsk']).toEqual({ price: 1, quantity: 2 });
    });
  });

  describe('fetchTopOfBook', () => {
    it('should return top of book', async () => {
      binanceConnector['bestBid'] = { price: 1, quantity: 2 };
      binanceConnector['bestAsk'] = { price: 3, quantity: 4 };

      const result = await binanceConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });

      expect(result).toEqual({ bid: 1, ask: 3 });
    });

    it('should return null if no top of book', async () => {
      binanceConnector['bestBid'] = null;
      binanceConnector['bestAsk'] = null;

      const result = await binanceConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });

      expect(result).toBeNull();
    });

    it('should return null if no best bid', async () => {
      binanceConnector['bestBid'] = null;
      binanceConnector['bestAsk'] = { price: 3, quantity: 4 };

      const result = await binanceConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });

      expect(result).toBeNull();
    });
  });
});