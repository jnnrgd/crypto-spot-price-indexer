import WebSocket from 'ws';
import { WebsocketClient } from '../../../src/infrastructure/ws/WebsocketClient';
import { NoConnectionError } from '../../../src/infrastructure/ws/errors';
import { logger } from '../../../src/infrastructure/logging/logger';

jest.mock('ws');
jest.mock('../../../src/infrastructure/logging/logger');

describe('WebSocketClient', () => {
  const mockUrl = 'ws://example.com';
  let websocketClient: WebsocketClient;
  let mockWebSocket: jest.Mocked<WebSocket>;

  beforeEach(() => {
    jest.clearAllMocks();

    websocketClient = new WebsocketClient(mockUrl);

    mockWebSocket = {
      on: jest.fn(),
      send: jest.fn((data, callback) => {
        if (callback) {
          callback(null);
        }
      }),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
    } as unknown as jest.Mocked<WebSocket>;

    (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWebSocket);
  });


  describe('connect', () => {
    it('should successfully connect to the server', async () => {
      (mockWebSocket.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'open') {
          callback();
        }
      });

      await expect(websocketClient.connect()).resolves.toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith('Connected to server');
    });

    it('should handle connection errors', async () => {
      const mockError = new Error('Connection failed');

      (mockWebSocket.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'error') {
          callback(mockError);
        }
      });

      await expect(websocketClient.connect()).rejects.toEqual(mockError);
      expect(logger.error).toHaveBeenCalledWith(`Websocket connection error: ${mockError}`);
    });

    it('should handle connection normal closure', async () => {
      (mockWebSocket.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1000, 'Normal closure');
        }
      });

      await expect(websocketClient.connect()).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith('WebSocket closed. Code: 1000, Reason: Normal closure');
    });

    it('should reconnect on abnormal closure', async () => {
      (mockWebSocket.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1006, 'Abnormal closure');
        }
      });

      await expect(websocketClient.connect()).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith('WebSocket closed. Code: 1006, Reason: Abnormal closure');
      expect(logger.info).toHaveBeenCalledWith('Reconnecting to server...');
      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should throw error if max attempts reached', async () => {
      (mockWebSocket.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'close') {
          callback(1006, 'Abnormal closure');
        }
      });

      websocketClient['reconnectAttempts'] = 5;

      await expect(websocketClient.connect()).resolves.toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith('WebSocket closed. Code: 1006, Reason: Abnormal closure');
      expect(logger.error).toHaveBeenCalledWith('Max reconnect attempts reached. Closing connection');
    });
  });

  describe('onMessage', () => {
    it('should invoke handler when a message is received', () => {
      const mockHandler = (jest.fn());
      const mockMessage = 'Test message';
      const rawData = Buffer.from(mockMessage);

      (mockWebSocket.on as jest.Mock).mockImplementationOnce((event, callback) => {
        if (event === 'message') {
          callback(rawData);
        }
      });

      websocketClient['ws'] = mockWebSocket;

      websocketClient.onMessage(mockHandler);

      expect(mockHandler).toHaveBeenCalledWith(rawData);
      expect(logger.debug).toHaveBeenCalledWith(`Received message: ${mockMessage}`);
    });

    it('should throw NoConnectionError if no connection', () => {
      websocketClient['ws'] = null;

      expect(() => websocketClient.onMessage(jest.fn())).toThrow(NoConnectionError);
    });
  });

  describe('send', () => {
    it('should send a message successfully if WebSocket is open', () => {
      const message = 'Hello, Server!';
      websocketClient['ws'] = mockWebSocket;

      websocketClient.send(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(message, expect.any(Function));
      expect(logger.debug).toHaveBeenCalledWith(`Sent message: ${message}`);
    });

    it('should throw NoConnectionError if WebSocket is not connected', () => {
      websocketClient['ws'] = null;

      expect(() => websocketClient.send('Hello')).toThrow(NoConnectionError);
    });

    it('should throw error if WebSocket send callback encounters an error', () => {
      const mockError = new Error('Send failed');

      websocketClient['ws'] = mockWebSocket;

      (mockWebSocket.send as jest.Mock).mockImplementationOnce((data: '', callback: (err?: Error) => void) => {
        callback(mockError);
      });

      expect(() => websocketClient.send('Hello')).toThrow(mockError);

      expect(logger.debug).not.toHaveBeenCalled();
    });

  })
});

