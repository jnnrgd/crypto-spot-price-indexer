import { MarketStatus } from '../../src/adapters/connectors/Huobi/dtos';
import { HuobiConnector } from '../../src/adapters/connectors/Huobi/HuobiConnector';
import nock from 'nock';

describe('HuobiConnector Integration', () => {
  let huobiConnector: HuobiConnector;

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
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('connect', () => {
    it('should connect successfully when Huobi is online', async () => {
      huobiConnector = new HuobiConnector();
      await expect(huobiConnector.connect()).resolves.not.toThrow();
      await expect(huobiConnector.isConnected()).resolves.toBe(true);
    });

    it('should throw an error when Huobi is not online', async () => {
      huobiConnector = new HuobiConnector();
      nock.cleanAll();
      nock('https://api.huobi.pro/')
        .get('/v2/market-status')
        .reply(200, {
          code: 200,
          message: 'success',
          data: {
            marketStatus: MarketStatus.Halted,
          },
        });

      await expect(huobiConnector.connect()).rejects.toThrow('Huobi is not online');
    });

    it('should throw an error when there are errors in the response', async () => {
      huobiConnector = new HuobiConnector();
      nock.cleanAll();
      nock('https://api.huobi.pro/')
        .get('/v2/market-status')
        .reply(200, {
          code: 500,
          message: 'Internal Server Error',
        });

      await expect(huobiConnector.connect()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('isConnected', () => {
    it('should return true if the market status is normal', async () => {
      huobiConnector = new HuobiConnector();
      await expect(huobiConnector.isConnected()).resolves.toBe(true);
    });

    it('should return false if the market status is not normal', async () => {
      huobiConnector = new HuobiConnector();
      nock.cleanAll();
      nock('https://api.huobi.pro/')
        .get('/v2/market-status')
        .reply(200, {
          code: 200,
          message: 'success',
          data: {
            marketStatus: MarketStatus.Halted,
          },
        });

      await expect(huobiConnector.isConnected()).resolves.toBe(false);
    });

    it('should return false if the response code is not 200', async () => {
      huobiConnector = new HuobiConnector();
      nock.cleanAll();
      nock('https://api.huobi.pro/')
        .get('/v2/market-status')
        .reply(200, {
          code: 500,
          message: 'Internal Server Error',
        });

      await expect(huobiConnector.isConnected()).resolves.toBe(false);
    });
  });

  describe('fetchTopOfBook', () => {
    it('should fetch top of book', async () => {
      huobiConnector = new HuobiConnector();
      const topOfBook = await huobiConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });
      expect(topOfBook).toEqual({ bid: 96391.15, ask: 96391.16 });
    });

    it('should return null if the response status is not ok', async () => {
      huobiConnector = new HuobiConnector();
      nock.cleanAll();
      nock('https://api.huobi.pro/')
        .get('/market/depth')
        .query({ symbol: 'btcusdt', depth: 5, type: 'step0' })
        .reply(200, {
          status: 'error',
          ch: 'market.btcusdt.depth.step0',
          ts: 1620000000000,
          tick: {
            ts: 1620000000000,
            version: 123456789,
            bids: [[96391.15, 0.219988], [96391.12, 2.0E-4], [96390.91, 2.0E-4], [96390.86, 2.0E-4], [96390.77, 2.0E-4]],
            asks: [[96391.16, 0.6682310659994132], [96392.15, 0.005044], [96392.87, 0.010407], [96392.92, 0.005508], [96395.98, 0.002656]],
          },
        });

      const topOfBook = await huobiConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });
      expect(topOfBook).toBeNull();
    });
  });

  it('should return null if bids or asks quantity is 0', async () => {
    huobiConnector = new HuobiConnector();
    nock.cleanAll();
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
          bids: [[96391.15, 0.0], [96391.12, 0.0], [96390.91, 0.0], [96390.86, 0.0], [96390.77, 0.0]],
          asks: [[96391.16, 0.0], [96392.15, 0.0], [96392.87, 0.0], [96392.92, 0.0], [96395.98, 0.0]],
        },
      });

    const topOfBook = await huobiConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });
    expect(topOfBook).toBeNull();
  });

  describe('getName', () => {
    it('should return the name of the connector', () => {
      huobiConnector = new HuobiConnector();
      expect(huobiConnector.getName()).toBe('HuobiConnector');
    });
  });
});