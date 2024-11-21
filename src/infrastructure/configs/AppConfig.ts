import 'dotenv/config';

export const binanceConfig = {
  httpUrl: process.env.BINANCE_HTTP_URL || 'https://api.binance.com',
  wsUrl: process.env.BINANCE_WS_URL || 'ws://127.0.0.1',
  wsPort: parseInt(process.env.BINANCE_WS_PORT || '12345'),
  wsPath: process.env.BINANCE_WS_PATH || '/ws',
  orderbookPath: process.env.BINANCE_ORDERBOOK_PATH || '/depth',
  orderbookStream: process.env.BINANCE_ORDERBOOK_STREAM || 'btcusdt@depth',
};

export const krakenConfig = {
  httpUrl: process.env.KRAKEN_HTTP_URL || 'https://api.kraken.com',
  orderbookPath: process.env.KRAKEN_ORDERBOOK_PATH || '/0/public/Depth',
  healthPath: process.env.KRAKEN_HEALTH_PATH || '/0/public/SystemStatus',
};

export const huobiConfig = {
  httpUrl: process.env.HUOBI_HTTP_URL || 'https://api.huobi.pro',
  orderbookPath: process.env.HUOBI_ORDERBOOK_PATH || '/market/depth',
  healthPath: process.env.HUOBI_HEALTH_PATH || '/v2/market-status',
};

export const serverPort = process.env.SERVER_PORT || 3000;

export const logLevel = process.env.LOG_LEVEL || 'info';