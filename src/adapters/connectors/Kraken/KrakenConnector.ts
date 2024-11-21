import { Pair } from '../../../core/domain/Pair';
import { TopOfBook } from '../../../core/domain/TopOfBook';
import { ExchangeConnector } from '../../../core/ports/ExchangeConnector';
import { krakenConfig } from '../../../infrastructure/configs/AppConfig';
import { HttpClient } from '../../../infrastructure/http/HttpClient';
import { logger } from '../../../infrastructure/logging/logger';
import { RequestOrderBookDto, ResponseOrderBookDto, ResponseSystemStatusDto } from './dtos';

const {
  httpUrl,
  orderbookPath,
  healthPath,
} = krakenConfig;

export class KrakenConnector implements ExchangeConnector {
  private httpClient: HttpClient;
  constructor() {
    this.httpClient = new HttpClient(httpUrl);
    this.httpClient.configure();
  }

  public async connect(): Promise<void> {
    const response = await this.httpClient.get<ResponseSystemStatusDto>(healthPath);
    if (response.error.length > 0) {
      throw new Error(response.error.join(', '));
    }
    if (response.result.status !== 'online') {
      throw new Error('Kraken is not online');
    }
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  public async isConnected(): Promise<boolean> {
    const response = await this.httpClient.get<ResponseSystemStatusDto>(healthPath);
    if (response.error.length === 0 && response.result.status === 'online') {
      return true;
    }
    return false;
  }

  public async fetchTopOfBook(pair: Pair): Promise<TopOfBook | null> {
    const asset = pair.asset === 'BTC' ? 'XBT' : pair.asset;
    const params: RequestOrderBookDto = {
      pair: `${asset}${pair.quote}`,
      count: 1,
    };
    const response = await this.httpClient.get<ResponseOrderBookDto>(orderbookPath, params);
    if (response.error && response.error.length > 0) {
      logger.error(response.error.join(', '));
      return null;
    }

    const result = response.result[`${asset}${pair.quote}`];
    if (!result) {
      return null;
    }

    const bid = parseFloat(result.bids[0][0]);
    const ask = parseFloat(result.asks[0][0]);

    if (isNaN(bid) || isNaN(ask)) {
      return null;
    }

    return { bid, ask };
  }

  getName(): string {
    return KrakenConnector.name;
  }

}