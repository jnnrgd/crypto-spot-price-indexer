import { OrderBook } from '../domain/OrderBook';

export interface ExchangeConnector {
  fetchOrderBook(pair: string): Promise<OrderBook>;
  getName(): string;
}
