import nock from "nock";
import { WebSocketServer } from "ws";
import { MarketStatus } from "../../src/adapters/connectors/Huobi/dtos";
import { PriceIndexController } from "../../src/adapters/api/controllers/PriceIndexController";
import express from "express";
import request from 'supertest'
import { krakenConfig, huobiConfig, binanceConfig } from "../../src/infrastructure/configs/AppConfig";


const {
  httpUrl: krakenHttpUrl,
  orderbookPath: krakenOrderbookPath,
  healthPath: krakenHealthPath,
} = krakenConfig;

const {
  httpUrl: huobiHttpUrl,
  orderbookPath: huobiOrderbookPath,
  healthPath: huobiHealthPath,
} = huobiConfig;

const {
  httpUrl: binanceHttpUrl,
  orderbookPath: binanceOrderbookPath,
  wsPort: binanceWsPort,
} = binanceConfig;

const app = express();
app.use(express.json());
app.get('/price-index/:pair', PriceIndexController.getPriceIndex);

describe('PriceIndexControllerIntegration', () => {
  let mockWsServer: WebSocketServer;

  beforeAll(() => {
    nock(huobiHttpUrl)
      .get(huobiOrderbookPath)
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
      .get(huobiHealthPath)
      .reply(200, {
        code: 200,
        message: 'success',
        data: {
          marketStatus: MarketStatus.Normal,
        },
      })
      .persist();

    nock(binanceHttpUrl)
      .get(binanceOrderbookPath)
      .query({ symbol: 'BTCUSDT', limit: 1 })
      .reply(200, {
        lastUpdateId: 12345,
        bids: [['96391.12', '2.0E-4']],
        asks: [['96392.15', '0.005044']],
      })
      .persist();

    nock(krakenHttpUrl)
      .get(krakenOrderbookPath)
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
      .get(krakenHealthPath)
      .reply(200, {
        error: [],
        result: {
          status: 'online',
          timestamp: '2021-01-01T00:00:00Z',
        }
      })
      .persist();

    mockWsServer = new WebSocketServer({ port: binanceWsPort });
  });

  afterAll(() => {
    nock.cleanAll();
    mockWsServer.clients.forEach((client) => client.close(1000));
    mockWsServer.removeAllListeners();
    mockWsServer.close();
  });
  it('should accept pair and return the mean price', async () => {
    const response = await request(app).get('/price-index/BTC-USDT');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      pair: {
        asset: 'BTC',
        quote: 'USDT',
      },
      price: 96391.56,
      timestamp: expect.any(Number),
    });
  });

  it('should return 400 if pair is invalid', async () => {
    const response = await request(app).get('/price-index/BTCUSD');
    expect(response.status).toBe(400);
  });


});
