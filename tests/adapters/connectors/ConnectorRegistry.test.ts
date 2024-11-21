import { ConnectorRegistry } from '../../../src/adapters/connectors/ConnectorRegistry'
import { ExchangeConnector } from '../../../src/core/ports/ExchangeConnector';

describe('ConnectorRegistry', () => {
  // Create a mock connector for testing
  class MockConnector implements ExchangeConnector {
    getName(): string { return 'MockExchange'; }
    fetchTopOfBook: jest.Mock = jest.fn();
    connect: jest.Mock = jest.fn();
    disconnect: jest.Mock = jest.fn();
    isConnected: jest.Mock = jest.fn();
  }

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a connector', () => {
      const registry = new ConnectorRegistry();
      const connector = new MockConnector();
      registry['register'](connector);

      expect(registry.getConnector('MockExchange')).toBe(connector);
    });
  });

  describe('getConnector', () => {
    it('should return a registered connector', () => {
      const connector = new MockConnector();
      const registry = new ConnectorRegistry();
      registry['register'](connector);

      const retrievedConnector = registry.getConnector('MockExchange');
      expect(retrievedConnector).toBe(connector);
    });

    it('should return undefined for unregistered connector', () => {
      const registry = new ConnectorRegistry();
      const retrievedConnector = registry.getConnector('NonExistentExchange');
      expect(retrievedConnector).toBeUndefined();
    });
  });

  describe('getConnectors', () => {
    it('should return all registered connectors', () => {
      const registry = new ConnectorRegistry();
      const connector1 = new MockConnector();
      class MockConnector2 implements ExchangeConnector {
        getName(): string { return "MockConnector2"; }
        fetchTopOfBook: jest.Mock = jest.fn();
        connect: jest.Mock = jest.fn();
        disconnect: jest.Mock = jest.fn();
        isConnected: jest.Mock = jest.fn();
      }
      const connector2 = new MockConnector2();

      registry['register'](connector1);
      registry['register'](connector2);

      const allConnectors = registry.getConnectors();
      expect(allConnectors).toHaveLength(2);
      expect(allConnectors).toContain(connector1);
      expect(allConnectors).toContain(connector2);
    });
  });

  describe('initialize', () => {
    it('should register all connectors', () => {
      const registry = new ConnectorRegistry();

      registry.initialize();

      expect(registry.getConnectors().length).toBe(3);
    });
  });
});
