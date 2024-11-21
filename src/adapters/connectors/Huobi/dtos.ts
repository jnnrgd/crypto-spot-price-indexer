export enum MarketStatus {
  Normal = 1,
  Halted = 2,
  Closed = 3,
}

export type DepthLevel = 5 | 10 | 20;

export enum OrderBookDepthType {
  Step0 = 'step0',
  Step1 = 'step1',
  Step2 = 'step2',
  Step3 = 'step3',
  Step4 = 'step4',
  Step5 = 'step5',
}

export interface SystemStatusResponse {
  code: number;
  message: string;
  data: {
    marketStatus: MarketStatus;
    haltStartTime?: string;
    haltEndTime?: string;
    haltReason?: string;
    affectedSymbols?: string[];
  }
}
export interface OrderBookResponse {
  status: string;
  ch: string;
  ts: number;
  tick: {
    ts: number;
    version: number;
    bids: [number, number][];
    asks: [number, number][];
  }
}

export interface OrderBookRequest {
  symbol: string;
  depth: DepthLevel;
  type: OrderBookDepthType;
}