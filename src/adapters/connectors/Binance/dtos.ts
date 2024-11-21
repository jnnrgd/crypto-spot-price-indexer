export interface RequestOrderBookDto {
  symbol: string;
  limit: number;
}

export interface ResponseOrderBookDto {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface WebsocketRequestMessageDto {
  method: string;
  params: string[];
  id: number | string;
}

export interface WebsocketResponseOrderBookDto {
  e: string;
  E: number;
  s: string;
  U: number;
  u: number;
  b: [string, string][];
  a: [string, string][];
}

export interface WebsocketResponseSubscriptionDto {
  result: string | null;
  id: number | string;
}
