export class NoConnectionError extends Error {
  constructor() {
    super('Not conntected to server');
  }
}