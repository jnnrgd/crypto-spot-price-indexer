import WebSocket from 'ws';
import { logger } from '../logging/logger';
import { NoConnectionError } from './errors';

const NORMAL_CLOSURE = 1000;
const MAX_RECONNECT_ATTEMPTS = 5;

export class WebsocketClient {
  private ws: WebSocket | null = null;
  private isReconnecting = false;
  private reconnectAttempts = 0;
  constructor(private url: string) {
    this.url = url;
  }
  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.on('open', () => {
        this.reconnectAttempts = 0;
        logger.info('Connected to server');
        resolve();
      });
      this.ws.on('close', (code, reason) => {
        logger.warn(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
        if (code !== NORMAL_CLOSURE && !this.isReconnecting && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts++;
          logger.warn(`Reconnecting attempt ${this.reconnectAttempts}`);
          this.reconnect();
        }
        if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
          logger.error('Max reconnect attempts reached. Closing connection');
        }
        this.ws = null;
        resolve();
      });
      this.ws.on('error', (error) => {
        logger.error(`Websocket connection error: ${error}`);
        this.ws = null;
        reject(error);
      });
    });
  }

  public onMessage(handler: (data: WebSocket.RawData) => void) {
    if (!this.ws) {
      throw new NoConnectionError();
    }
    this.ws.on('message', (data) => {
      const message = data.toString();
      logger.debug(`Received message: ${message}`);
      handler(data);
    });
  }

  public close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      logger.info('Websocket connection closed');
    }
  }
  private async reconnect() {
    this.isReconnecting = true;
    logger.info('Reconnecting to server...');

    this.close();
    await this.connect();

    this.isReconnecting = false;
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