import { InvalidPairError } from '../domain/errors/InvalidPairError';
import { Pair } from '../domain/Pair';

export function validatePair(pair: string): Pair {
  const [asset, quote] = pair.split('-');
  if (!asset || !quote) {
    throw new InvalidPairError();
  }
  return {
    asset: asset.toUpperCase(),
    quote: quote.toUpperCase(),
  };
}
