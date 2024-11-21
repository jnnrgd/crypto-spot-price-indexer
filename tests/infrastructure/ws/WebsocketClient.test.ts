import WebSocket from 'ws';
import { WebsocketClient } from '../../../src/infrastructure/ws/WebsocketClient';
import { NoConnectionError } from '../../../src/infrastructure/ws/errors';
import { logger } from '../../../src/infrastructure/logging/logger';
import { WebSocketConfig } from '../../../src/infrastructure/ws/types';

jest.mock('ws');
jest.mock('../../../src/infrastructure/logging/logger');

describe('WebSocketClient', () => {
  const mockUrl = 'ws://example.com';
  const wsConfig: WebSocketConfig = {
    url: mockUrl,
    onOpen: jest.fn(),
    onMessage: jest.fn(),
  }
  let websocketClient: WebsocketClient;
  let mockWebSocket: jest.Mocked<WebSocket>;

  beforeEach(() => {
    jest.clearAllMocks();

    websocketClient = new WebsocketClient(wsConfig);

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
    // it('should successfully connect to the server', async () => {
    //   (mockWebSocket.on as jest.Mock).mockImplementation((event, callback) => {
    //     if (event === 'open') {
    //       callback();
    //     }
    //   });

    //   await expect(websocketClient.connect()).resolves.toBeUndefined();
    //   expect(logger.info).toHaveBeenCalledWith('Connected to server');
    // });

    // it('should handle connection errors', async () => {
    //   const mockError = new Error('Connection failed');

    //   (mockWebSocket.on as jest.Mock).mockImplementation((event, callback) => {
    //     if (event === 'error') {
    //       callback(mockError);
    //     }
    //   });

    //   await expect(websocketClient.connect()).rejects.toEqual(mockError);
    //   expect(logger.error).toHaveBeenCalledWith(`Websocket connection error: ${mockError}`);
    // });
    it('should handle connection normal closure', async () => {
      let openCallback: Function = () => { };
      let closeCallback: Function = () => { };

      (mockWebSocket.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'open') {
          openCallback = callback;
        }
        if (event === 'close') {
          closeCallback = callback;
        }
      });

      const connectPromise = websocketClient.connect();

      openCallback();

      await connectPromise;

      closeCallback(1000, 'Normal closure');

      expect(logger.warn).toHaveBeenCalledWith(
        'WebSocket closed. Code: 1000, Reason: Normal closure'
      );
    });

    it('should reconnect on abnormal closure', async () => {
      let openCallback: Function = () => { };
      let closeCallback: Function = () => { };

      (mockWebSocket.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'open') {
          openCallback = callback;
        }
        if (event === 'close') {
          closeCallback = callback;
        }
      });

      const connectPromise = websocketClient.connect();

      openCallback();

      await connectPromise;

      closeCallback(1006, 'Abnormal closure');
      expect(logger.warn).toHaveBeenNthCalledWith(1,
        'WebSocket closed. Code: 1006, Reason: Abnormal closure'
      );
      expect(logger.warn).toHaveBeenNthCalledWith(2,
        'Reconnect attempt 1'
      );

    });

    it('should throw error if max attempts reached', async () => {
      let openCallback: Function = () => { };
      let closeCallback: Function = () => { };

      (mockWebSocket.on as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'open') {
          openCallback = callback;
        }
        if (event === 'close') {
          closeCallback = callback;
        }
      });

      const connectPromise = websocketClient.connect();

      openCallback();

      await connectPromise;
      websocketClient['reconnectAttempts'] = 5;
      closeCallback(1006, 'Abnormal closure');
      expect(logger.error).toHaveBeenCalledWith('Max reconnect attempts reached. Closing connection');

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

  });
});

