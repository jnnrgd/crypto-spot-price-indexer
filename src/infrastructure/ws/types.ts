import WebSocket from 'ws';

export interface WebSocketConfig {
  url: string;
  onOpen: () => void;
  onMessage: (data: WebSocket.RawData) => void;
}
