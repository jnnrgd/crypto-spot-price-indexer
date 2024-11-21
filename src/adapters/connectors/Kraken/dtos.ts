export interface ResponseSystemStatusDto {
  error: string[];
  result: {
    status: string;
    timestamp: string;
  };
}

interface OrderBook {
  bids: [string, string, number][];
  asks: [string, string, number][];
}

export interface ResponseOrderBookDto {
  error: string[];
  result: {
    [key: string]: OrderBook;
  }
}

export interface RequestOrderBookDto {
  pair: string;
  count: number;
}