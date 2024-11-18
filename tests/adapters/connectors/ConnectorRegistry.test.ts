import { ConnectorRegistry } from '../../../src/adapters/connectors/ConnectorRegistry'
import { ExchangeConnector } from '../../../src/core/ports/ExchangeConnector';

describe('ConnectorRegistry', () => {
  // Create a mock connector for testing
  class MockConnector implements ExchangeConnector {
    getName(): string { return 'MockExchange'; }
    fetchOrderBook: jest.Mock = jest.fn();
  }

  beforeEach(() => {
    // Reset the registry before each test
    (ConnectorRegistry as any).connectors.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a connector', () => {
      const connector = new MockConnector();
      ConnectorRegistry.register(connector);

      expect(ConnectorRegistry.getConnector('MockExchange')).toBe(connector);
    });
  });

  describe('getConnector', () => {
    it('should return a registered connector', () => {
      const connector = new MockConnector();
      ConnectorRegistry.register(connector);

      const retrievedConnector = ConnectorRegistry.getConnector('MockExchange');
      expect(retrievedConnector).toBe(connector);
    });

    it('should return undefined for unregistered connector', () => {
      const retrievedConnector = ConnectorRegistry.getConnector('NonExistentExchange');
      expect(retrievedConnector).toBeUndefined();
    });
  });

  describe('getAllConnectors', () => {
    it('should return all registered connectors', () => {
      const connector1 = new MockConnector();
      class MockConnector2 implements ExchangeConnector {
        getName(): string { return "MockConnector2"; }
        fetchOrderBook: jest.Mock = jest.fn();
      }
      const connector2 = new MockConnector2();

      ConnectorRegistry.register(connector1);
      ConnectorRegistry.register(connector2);

      const allConnectors = ConnectorRegistry.getAllConnectors();
      expect(allConnectors).toHaveLength(2);
      expect(allConnectors).toContain(connector1);
      expect(allConnectors).toContain(connector2);
    });
  });
});
