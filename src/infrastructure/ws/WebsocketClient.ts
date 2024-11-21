import WebSocket from 'ws';
import { logger } from '../logging/logger';
import { NoConnectionError } from './errors';
import { WebSocketConfig } from './types';

const NORMAL_CLOSURE = 1000;
const MAX_RECONNECT_ATTEMPTS = 5;

export class WebsocketClient {
  private ws: WebSocket | null = null;
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private url: string;
  private onOpen: () => void;
  private onMessage: (data: WebSocket.RawData) => void;
  constructor(config: WebSocketConfig) {
    this.url = config.url;
    this.onOpen = config.onOpen;
    this.onMessage = config.onMessage;
  }
  public async connect(): Promise<void> {
    await this.initializeWebsocket();
    await this.setupHandlers();
  }

  private async initializeWebsocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.on('open', () => {
        this.reconnectAttempts = 0;
        logger.info('Connected to server');
        this.onOpen();
        resolve();
      });
      this.ws.on('error', (error) => {
        logger.error(`Websocket connection error: ${error}`);
        this.ws = null;
        reject(error);
      });
    });
  }

  private async setupHandlers(): Promise<void> {
    logger.debug('Setting up websocket handlers');
    if (!this.ws) {
      throw new NoConnectionError();
    }
    this.ws.on('close', async (code, reason) => {
      logger.warn(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
      if (code !== NORMAL_CLOSURE && !this.isReconnecting) {
        this.isReconnecting = true;
        await this.reconnect();
        this.isReconnecting = false;
      }
    });
    this.ws.on('message', (data) => {
      const message = data.toString();
      logger.debug(`Received message: ${message}`);
      this.onMessage(data);
    });
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public close() {
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
      logger.info('Websocket connection closed');
    }
  }
  private async reconnect() {
    logger.info('Reconnecting to server...');
    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      logger.warn(`Reconnect attempt ${this.reconnectAttempts}`);
      this.close();
      await this.connect();
    } else {
      logger.error('Max reconnect attempts reached. Closing connection');
      this.ws = null;
    }
  }


  public send(data: WebSocket.Data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new NoConnectionError();
    }
    this.ws.send(data, (error) => {
      if (error) {
        throw error;
      }
      logger.debug(`Sent message: ${data}`);
    });
  }
}