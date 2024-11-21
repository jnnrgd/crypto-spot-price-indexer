import { Pair } from '../../../core/domain/Pair';
import { TopOfBook } from '../../../core/domain/TopOfBook';
import { ExchangeConnector } from '../../../core/ports/ExchangeConnector';
import { huobiConfig } from '../../../infrastructure/configs/AppConfig';
import { HttpClient } from '../../../infrastructure/http/HttpClient';
import { logger } from '../../../infrastructure/logging/logger';
import { MarketStatus, OrderBookDepthType, OrderBookRequest, OrderBookResponse, SystemStatusResponse } from './dtos';

const {
  httpUrl,
  orderbookPath,
  healthPath,
} = huobiConfig;

export class HuobiConnector implements ExchangeConnector {
  private httpClient: HttpClient;
  constructor() {
    this.httpClient = new HttpClient(httpUrl);
    this.httpClient.configure();
  }

  public async connect(): Promise<void> {
    const response = await this.httpClient.get<SystemStatusResponse>(healthPath);
    if (response.code != 200) {
      throw new Error(response.message);
    }
    if (response.data.marketStatus !== MarketStatus.Normal) {
      throw new Error('Huobi is not online');
    }
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  public async isConnected(): Promise<boolean> {
    const response = await this.httpClient.get<SystemStatusResponse>(healthPath);
    if (response.code === 200 && response.data.marketStatus === MarketStatus.Normal) {
      return true;
    }
    return false;
  }

  public async fetchTopOfBook(pair: Pair): Promise<TopOfBook | null> {
    const params: OrderBookRequest = {
      symbol: `${pair.asset.toLowerCase()}${pair.quote.toLowerCase()}`,
      depth: 5,
      type: OrderBookDepthType.Step0,
    };
    const response = await this.httpClient.get<OrderBookResponse>(orderbookPath, params);
    if (response.status !== 'ok') {
      logger.error(response.status);
      return null;
    }
    const validBids = response.tick.bids.filter((bid) => bid[1] > 0);
    const validAsks = response.tick.asks.filter((ask) => ask[1] > 0);
    if (validAsks.length === 0 || validBids.length === 0) {
      return null;
    }

    return {
      bid: validBids[0][0],
      ask: validAsks[0][0],
    };
  }

  getName(): string {
    return HuobiConnector.name;
  }

}