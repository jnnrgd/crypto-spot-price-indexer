import { TopOfBook } from '../domain/TopOfBook';
import { Pair } from '../domain/Pair';

export interface ExchangeConnector {
  fetchTopOfBook(pair: Pair): Promise<TopOfBook>;
  getName(): string;
}
