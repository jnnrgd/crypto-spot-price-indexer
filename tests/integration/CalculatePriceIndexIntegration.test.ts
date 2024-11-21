import nock from "nock";
import { MarketStatus } from "../../src/adapters/connectors/Huobi/dtos";
import { WebSocketServer } from "ws";
import { ConnectorRegistry } from "../../src/adapters/connectors/ConnectorRegistry";
import { CalculatePriceIndex } from "../../src/core/usecases/CalculatePriceIndex";

describe('CalculatePriceIndex Integration', () => {
  let mockWsServer: WebSocketServer;
  let registry: ConnectorRegistry;

  beforeEach(() => {
    nock('https://api.huobi.pro/')
      .get('/market/depth')
      .query({ symbol: 'btcusdt', depth: 5, type: 'step0' })
      .reply(200, {
        status: 'ok',
        ch: 'market.btcusdt.depth.step0',
        ts: 1620000000000,
        tick: {
          ts: 1620000000000,
          version: 123456789,
          bids: [[96391.15, 0.219988], [96391.12, 2.0E-4], [96390.91, 2.0E-4], [96390.86, 2.0E-4], [96390.77, 2.0E-4]],
          asks: [[96391.16, 0.6682310659994132], [96392.15, 0.005044], [96392.87, 0.010407], [96392.92, 0.005508], [96395.98, 0.002656]],
        },
      })
      .get('/v2/market-status')
      .reply(200, {
        code: 200,
        message: 'success',
        data: {
          marketStatus: MarketStatus.Normal,
        },
      })
      .persist();

    nock('https://api.binance.com')
      .get('/depth')
      .query({ symbol: 'BTCUSDT', limit: 1 })
      .reply(200, {
        lastUpdateId: 12345,
        bids: [['96391.12', '2.0E-4']],
        asks: [['96392.15', '0.005044']],
      })
      .persist();

    nock('https://api.kraken.com/0/public/')
      .get('/Depth')
      .query({ pair: 'BTCUSDT', count: 1 })
      .reply(200, {
        error: [],
        result: {
          BTCUSDT: {
            bids: [['96390.91', '2.0E-4']],
            asks: [['96392.87, 0.010407']],
          }
        }
      })
      .get('/SystemStatus')
      .reply(200, {
        error: [],
        result: {
          status: 'online',
          timestamp: '2021-01-01T00:00:00Z',
        }
      })
      .persist();

    mockWsServer = new WebSocketServer({ port: 12345 });
    registry = new ConnectorRegistry();
    registry.initialize();
  });

  afterEach(() => {
    nock.cleanAll();
    mockWsServer.clients.forEach((client) => client.close(1000));
    mockWsServer.removeAllListeners();
    mockWsServer.close();
  });

  describe('get mean price', () => {
    it('should return the mean price of all exchanges', async () => {
      const calculator = new CalculatePriceIndex(registry);

      const { price } = await calculator.mean({ asset: 'BTC', quote: 'USDT' });
      expect(price).toBe(96391.56);
    });
  });

  describe('get median price', () => {
    it('should return the median price of all exchanges', async () => {
      const calculator = new CalculatePriceIndex(registry);

      const { price } = await calculator.median({ asset: 'BTC', quote: 'USDT' });
      expect(price).toBe(96391.635);
    });
  });
});