import { TopOfBook } from '../../../core/domain/TopOfBook';
import { Pair } from '../../../core/domain/Pair';
import { ExchangeConnector } from '../../../core/ports/ExchangeConnector';
import { WebsocketClient } from '../../../infrastructure/ws/WebsocketClient';
import type WebSocket from 'ws';
import { HttpClient } from '../../../infrastructure/http/HttpClient';
import { RequestOrderBookDto, ResponseOrderBookDto, WebsocketRequestMessageDto, WebsocketResponseOrderBookDto } from './dtos';
import { logger } from '../../../infrastructure/logging/logger';
import { binanceConfig } from '../../../infrastructure/configs/AppConfig';

const {
  httpUrl,
  wsUrl,
  wsPort,
  wsPath,
  orderbookPath,
  orderbookStream,
} = binanceConfig;

export class BinanceConnector implements ExchangeConnector {
  private ws: WebsocketClient;
  private httpClient: HttpClient;
  private bestBid: { price: number; quantity: number } | null = null;
  private bestAsk: { price: number; quantity: number } | null = null;
  private lastUpdateId: number = 0;
  private id: string;
  constructor() {
    this.id = 'ERZERAZEFEDAQEDCEDQSXCZA214144RDEAQ';
    this.httpClient = new HttpClient(httpUrl);
    this.httpClient.configure();
    this.ws = this.configureWebsocket(`${wsUrl}:${wsPort}${wsPath}`);
  }

  public async connect(): Promise<void> {
    await this.initializeTopOfBook();
    await this.ws.connect();
  }

  private configureWebsocket(url: string): WebsocketClient {
    logger.debug('Configuring websocket');
    return new WebsocketClient({
      url,
      onOpen: () => {
        this.subscribeToChannel();
      },
      onMessage: this.handleMessage,
    });
  }

  handleMessage = (data: WebSocket.RawData) => {
    const message = JSON.parse(data.toString());
    if (message.e === 'depthUpdate') {
      logger.debug('New depth update received');
      this.handleDepthUpdate(message as WebsocketResponseOrderBookDto);
    }
    if (message.result === null) {
      logger.debug('Sub/Unsub successful');
    }
  };

  private async initializeTopOfBook() {
    const params: RequestOrderBookDto = {
      symbol: 'BTCUSDT',
      limit: 1,
    };
    const response = await this.httpClient.get<ResponseOrderBookDto>(
      orderbookPath,
      params,
    );
    this.lastUpdateId = response.lastUpdateId;
    this.bestBid = {
      price: parseFloat(response.bids[0][0]),
      quantity: parseFloat(response.bids[0][1]),
    };
    this.bestAsk = {
      price: parseFloat(response.asks[0][0]),
      quantity: parseFloat(response.asks[0][1]),
    };
  }

  private subscribeToChannel() {
    const subMessage: WebsocketRequestMessageDto = {
      method: 'SUBSCRIBE',
      params: [orderbookStream],
      id: this.id,
    };
    logger.debug('Subscribing to channel');
    this.ws.send(JSON.stringify(subMessage));
  }

  private async unsubscribeFromChannel(): Promise<void> {
    const unsubMessage: WebsocketRequestMessageDto = {
      method: 'UNSUBSCRIBE',
      params: [orderbookStream],
      id: this.id,
    };
    logger.debug('Unsubscribing from channel');
    this.ws.send(JSON.stringify(unsubMessage));
  }

  public async disconnect(): Promise<void> {
    await this.unsubscribeFromChannel();
    this.ws.close();
  }

  public async isConnected(): Promise<boolean> {
    return this.ws && this.ws.isConnected();
  }

  private handleDepthUpdate(data: WebsocketResponseOrderBookDto) {
    const { U, u, b: bids, a: asks } = data;

    if (u <= this.lastUpdateId) return;

    if (U > this.lastUpdateId + 1) {
      logger.warn('Gap detected. Refetching snapshot...');
      this.initializeTopOfBook();
      return;
    }

    this.lastUpdateId = u;

    this.updateBestBid(bids);
    this.updateBestAsk(asks);

  }

  private updateBestBid(bids: [string, string][]) {
    for (const [p, q] of bids) {
      const price = parseFloat(p);
      const quantity = parseFloat(q);
      if (quantity === 0) {
        if (this.bestBid?.price === price) {
          this.bestBid = null;
        }
      } else if (!this.bestBid || price > this.bestBid.price) {
        this.bestBid = { price, quantity };
      }
    }
  }

  private updateBestAsk(asks: [string, string][]) {
    for (const [p, q] of asks) {
      const price = parseFloat(p);
      const quantity = parseFloat(q);
      if (quantity === 0) {
        if (this.bestAsk?.price === price) {
          this.bestAsk = null;
        }
      } else if (!this.bestAsk || price < this.bestAsk.price) {
        this.bestAsk = { price, quantity };
      }
    }
  }

  public async fetchTopOfBook(_pair: Pair): Promise<TopOfBook | null> {
    if (!this.bestBid || !this.bestAsk) {
      return null;
    }
    return {
      bid: this.bestBid.price,
      ask: this.bestAsk.price,
    };
  }
  getName(): string {
    return BinanceConnector.name;
  }
}