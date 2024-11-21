import { TopOfBook } from '../domain/TopOfBook';
import { Pair } from '../domain/Pair';

export interface ExchangeConnector {
  fetchTopOfBook(pair: Pair): Promise<TopOfBook | null>;
  getName(): string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): Promise<boolean>;
}
