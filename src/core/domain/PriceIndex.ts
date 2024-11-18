import { Pair } from './Pair';

export interface PriceIndex {
  pair: Pair;
  price: number;
  timestamp: number;
}
