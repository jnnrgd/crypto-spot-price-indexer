import { KrakenConnector } from '../../src/adapters/connectors/Kraken/KrakenConnector';
import nock from 'nock';


describe('KrakenConnector Integration', () => {
  let krakenConnector: KrakenConnector;

  beforeEach(() => {
    nock('https://api.kraken.com/0/public/')
      .get('/Depth')
      .query({ pair: 'BTCUSDT', count: 1 })
      .reply(200, {
        error: [],
        result: {
          BTCUSDT: {
            bids: [['40000.00', '1.0']],
            asks: [['40001.00', '1.5']],
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
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('connect', () => {
    it('should connect successfully when Kraken is online', async () => {
      krakenConnector = new KrakenConnector();
      await expect(krakenConnector.connect()).resolves.not.toThrow();
      await expect(krakenConnector.isConnected()).resolves.toBe(true);
    });

    it('should throw an error when Kraken is not online', async () => {
      krakenConnector = new KrakenConnector();
      nock.cleanAll();
      nock('https://api.kraken.com/0/public/')
        .get('/SystemStatus')
        .reply(200, {
          error: [],
          result: {
            status: 'offline',
            timestamp: '2021-01-01T00:00:00Z',
          }
        });

      await expect(krakenConnector.connect()).rejects.toThrow('Kraken is not online');
    });

    it('should throw an error when there are errors in the response', async () => {
      krakenConnector = new KrakenConnector();
      nock.cleanAll();
      nock('https://api.kraken.com/0/public/')
        .get('/SystemStatus')
        .reply(200, {
          error: ['Some error'],
          result: {
            status: 'online',
            timestamp: '2021-01-01T00:00:00Z',
          }
        });

      await expect(krakenConnector.connect()).rejects.toThrow('Some error');
    });
  });

  describe('fetchTopOfBook', () => {
    it('should fetch top of book', async () => {
      krakenConnector = new KrakenConnector();
      await krakenConnector.connect();
      await expect(
        krakenConnector.fetchTopOfBook({
          asset: 'BTC',
          quote: 'USDT',
        })).resolves.toEqual({
          bid: 40000,
          ask: 40001,
        });
    });

    it('should return null when there are errors in the response', async () => {
      krakenConnector = new KrakenConnector();
      nock.cleanAll();
      nock('https://api.kraken.com/0/public/')
        .get('/Depth')
        .query({ pair: 'BTCUSDT', count: 1 })
        .reply(200, {
          error: ['Some error'],
          result: {
            BTCUSDT: {
              bids: [['40000.00', '1.0']],
              asks: [['40001.00', '1.5']],
            }
          }
        });

      await expect(krakenConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' })).resolves.toBeNull();
    });

    it('should return null when bid or ask is not a number', async () => {
      krakenConnector = new KrakenConnector();
      nock.cleanAll();
      nock('https://api.kraken.com/0/public/')
        .get('/Depth')
        .query({ pair: 'BTCUSDT', count: 1 })
        .reply(200, {
          error: [],
          result: {
            BTCUSDT: {
              bids: [['Not a number', '1.0']],
              asks: [['40001.00', '1.5']],
            }
          }
        });

      await expect(krakenConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' })).resolves.toBeNull();
    });
  });

  describe('isConnected', () => {
    it('should return true when Kraken is online', async () => {
      krakenConnector = new KrakenConnector();
      await expect(krakenConnector.isConnected()).resolves.toBe(true);
    });

    it('should return false when Kraken is not online', async () => {
      krakenConnector = new KrakenConnector();
      nock.cleanAll();
      nock('https://api.kraken.com/0/public/')
        .get('/SystemStatus')
        .reply(200, {
          error: [],
          result: {
            status: 'offline',
            timestamp: '2021-01-01T00:00:00Z',
          }
        });

      await expect(krakenConnector.isConnected()).resolves.toBe(false);
    });

    it('should return false when there are errors in the response', async () => {
      krakenConnector = new KrakenConnector();
      nock.cleanAll();
      nock('https://api.kraken.com/0/public/')
        .get('/SystemStatus')
        .reply(200, {
          error: ['Some error'],
          result: {
            status: 'online',
            timestamp: '2021-01-01T00:00:00Z',
          }
        });
    });
  });
});