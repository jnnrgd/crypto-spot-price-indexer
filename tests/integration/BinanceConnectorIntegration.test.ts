import { WebSocketServer } from 'ws';
import nock from 'nock';
import { BinanceConnector } from '../../src/adapters/connectors/Binance/BinanceConnector';
import { binanceConfig } from '../../src/infrastructure/configs/AppConfig';


const {
  httpUrl,
  wsPort,
  wsPath,
  wsUrl,
  orderbookPath,
  orderbookStream,
} = binanceConfig;

describe('BinanceConnectorIntegration', () => {
  let mockWsServer: WebSocketServer;
  let binanceConnector: BinanceConnector;

  beforeAll(() => {
    nock(httpUrl)
      .get(orderbookPath)
      .query({ symbol: 'BTCUSDT', limit: 1 })
      .reply(200, {
        lastUpdateId: 12345,
        bids: [['40000.00', '1.0']],
        asks: [['40001.00', '1.5']],
      })
      .persist();
  });

  afterAll(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    mockWsServer = new WebSocketServer({ port: wsPort });
    binanceConnector = new BinanceConnector();
  });

  afterEach(async () => {
    await binanceConnector.isConnected() && await binanceConnector.disconnect();
    mockWsServer.clients.forEach((client) => client.close(1000));
    mockWsServer.removeAllListeners();
    mockWsServer.close();
  });

  describe('initialization', () => {
    it('should initialize object and top of book should be null', async () => {
      expect(binanceConnector.getName()).toBe(BinanceConnector.name);
      await expect(binanceConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' })).resolves.toBeNull();
    });

    it('should initialize top of book', async () => {
      await binanceConnector['initializeTopOfBook']();
      expect(binanceConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' })).resolves.toEqual({ bid: 40000, ask: 40001 });
    });

    it('should connect to websocket', async () => {
      await binanceConnector.connect();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockWsServer.clients.size).toBe(1);
    });
  });

  describe('subscribing and unsubscribing', () => {
    it('should send subscribe message', async () => {
      let message: any;
      mockWsServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          message = JSON.parse(data.toString());
        });
      });
      await binanceConnector.connect();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(message.method).toBe('SUBSCRIBE');
      expect(message.params).toEqual([orderbookStream]);
      expect(message.id).toBeTruthy();
    });
    it('should send unsubscribe message', async () => {
      let messages: any[] = [];
      mockWsServer.on('connection', (socket) => {
        socket.on('message', (data) => {
          messages.push(JSON.parse(data.toString()));
        });
      });
      await binanceConnector.connect();
      await new Promise(resolve => setTimeout(resolve, 50));
      await binanceConnector.disconnect();
      await new Promise(resolve => setTimeout(resolve, 50));
      const unsubMessages = messages.filter((message) => message.method === 'UNSUBSCRIBE');
      expect(unsubMessages.length).toBe(1);
      expect(unsubMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ params: [orderbookStream], id: expect.anything(), method: 'UNSUBSCRIBE' }),
        ])
      );
    });
  });

  describe('ping pong', () => {
    it('should respond to ping with pong', async () => {
      let pongReceived = false;
      mockWsServer.on('connection', (socket) => {
        socket.ping();
        socket.on('pong', () => {
          pongReceived = true;
        });
      });
      await binanceConnector.connect();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(pongReceived).toBe(true);
    });
  });

  describe('reconnecting', () => {
    it('should reconnect after connection is closed', async () => {
      let connectionAttempts = 0;
      mockWsServer.on('connection', (socket) => {
        connectionAttempts++;
        if (connectionAttempts === 1) {
          socket.close();
        } else (socket.close(1000))
      });
      await binanceConnector.connect();
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(connectionAttempts).toBe(2);
    });
  });

  describe('fetch top of book', () => {
    it('should fetch top of book', async () => {
      await binanceConnector.connect();
      await new Promise(resolve => setTimeout(resolve, 50));
      const topOfBook = await binanceConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });
      expect(topOfBook).toEqual({ bid: 40000, ask: 40001 });
    });
  });

  describe('update top of book', () => {
    it('should update top of book', async () => {
      binanceConnector = new BinanceConnector();
      await binanceConnector.connect();
      await new Promise(resolve => setTimeout(resolve, 50));
      mockWsServer.clients.forEach((client) => client.send((JSON.stringify({
        e: 'depthUpdate',
        U: 12344,
        u: 12346,
        s: 'BTCUSDT',
        b: [['40001.00', '1.0']],
        a: [['40000.50', '1.5']],
      }))));
      await new Promise(resolve => setTimeout(resolve, 100));
      const topOfBook = await binanceConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });
      expect(topOfBook).toEqual({ bid: 40001, ask: 40000.5 });
    });

    it('should not update if out of sync', async () => {
      binanceConnector = new BinanceConnector();
      await binanceConnector.connect();
      await new Promise(resolve => setTimeout(resolve, 50));
      mockWsServer.clients.forEach((client) => client.send((JSON.stringify({
        e: 'depthUpdate',
        U: 12347,
        u: 12346,
        s: 'BTCUSDT',
        b: [['40001.00', '1.0']],
        a: [['40000.50', '1.5']],
      }))));
      await new Promise(resolve => setTimeout(resolve, 100));
      const topOfBook = await binanceConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });
      expect(topOfBook).toEqual({ bid: 40000, ask: 40001 });
    });

    it('should not update if quantity is 0', async () => {
      binanceConnector = new BinanceConnector();
      await binanceConnector.connect();
      await new Promise(resolve => setTimeout(resolve, 50));
      mockWsServer.clients.forEach((client) => client.send((JSON.stringify({
        e: 'depthUpdate',
        U: 12345,
        u: 12346,
        s: 'BTCUSDT',
        b: [['40001.00', '0.0']],
        a: [['40000.50', '0.0']],
      }))));
      await new Promise(resolve => setTimeout(resolve, 100));
      const topOfBook = await binanceConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });
      expect(topOfBook).toEqual({ bid: 40000, ask: 40001 });
    });

    it('should clear bid if quantity is 0', async () => {
      binanceConnector = new BinanceConnector();
      await binanceConnector.connect();
      await new Promise(resolve => setTimeout(resolve, 50));
      mockWsServer.clients.forEach((client) => client.send((JSON.stringify({
        e: 'depthUpdate',
        U: 12345,
        u: 12346,
        s: 'BTCUSDT',
        b: [['40000.00', '0.0']],
        a: [['40001.00', '0.0']],
      }))));
      await new Promise(resolve => setTimeout(resolve, 100));
      const topOfBook = await binanceConnector.fetchTopOfBook({ asset: 'BTC', quote: 'USDT' });
      expect(topOfBook).toBeNull();
    });
  });
});
