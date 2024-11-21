import { BinanceConnector } from "../../src/adapters/connectors/Binance/BinanceConnector";
import { ConnectorRegistry } from "../../src/adapters/connectors/ConnectorRegistry";
import { HuobiConnector } from "../../src/adapters/connectors/Huobi/HuobiConnector";
import { KrakenConnector } from "../../src/adapters/connectors/Kraken/KrakenConnector";


describe('ConnectorRegistry Integration Test', () => {
  let connectorRegistry: ConnectorRegistry;

  beforeEach(() => {
    connectorRegistry = new ConnectorRegistry();
    connectorRegistry.initialize();
  });

  it('should register and retrieve BinanceConnector', () => {
    const binanceConnector = connectorRegistry.getConnector(BinanceConnector.name);
    expect(binanceConnector).toBeInstanceOf(BinanceConnector);
  });

  it('should register and retrieve KrakenConnector', () => {
    const krakenConnector = connectorRegistry.getConnector(KrakenConnector.name);
    expect(krakenConnector).toBeInstanceOf(KrakenConnector);
  });

  it('should register and retrieve HuobiConnector', () => {
    const huobiConnector = connectorRegistry.getConnector(HuobiConnector.name);
    expect(huobiConnector).toBeInstanceOf(HuobiConnector);
  });

  it('should return all registered connectors', () => {
    const connectors = connectorRegistry.getConnectors();
    expect(connectors.length).toBe(3);
    expect(connectors).toEqual(
      expect.arrayContaining([
        expect.any(BinanceConnector),
        expect.any(KrakenConnector),
        expect.any(HuobiConnector),
      ])
    );
  });
});
