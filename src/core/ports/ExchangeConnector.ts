import { OrderBook } from '../domain/OrderBook';
import { Pair } from '../domain/Pair';

export interface ExchangeConnector {
  fetchOrderBook(pair: Pair): Promise<OrderBook>;
  getName(): string;
}
