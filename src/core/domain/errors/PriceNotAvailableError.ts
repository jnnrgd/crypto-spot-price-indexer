export class PricesNotAvailableError extends Error {
  constructor() {
    super('Prices not available');
  }
}
