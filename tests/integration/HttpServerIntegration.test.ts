import request from 'supertest';
import { app } from '../../src/infrastructure/http/HttpServer';
import logHandler from '../../src/adapters/api/middleware/LogHandler';

jest.mock('../../src/adapters/api/middleware/LogHandler', () => {
  return jest.fn((req, res, next) => {
    console.log('LogHandler called');
    next();
  });
});

jest.mock('../../src/core/usecases/CalculatePriceIndex', () => {
  return {
    CalculatePriceIndex: jest.fn().mockImplementation(() => {
      return {
        mean: jest.fn().mockResolvedValue({
          pair: { asset: 'BTC', quote: 'USDT' },
          price: 10000,  // Mocked price
          timestamp: Date.now(),
        }),
        median: jest.fn().mockResolvedValue({
          pair: { asset: 'BTC', quote: 'USDT' },
          price: 10000,
          timestamp: Date.now(),
        }),
      };
    }),
  };
});

describe('HTTP Server Integration Tests', () => {

  it('should have security headers applied by helmet', async () => {
    const response = await request(app).get('/price-index');
    expect(response.headers['x-dns-prefetch-control']).toBe('off');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toBeUndefined();
  });

  it('should allow cross-origin requests (CORS)', async () => {
    const response = await request(app).options('/price-index');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('*');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/unknown-route');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Route not found');
  });

  it('should return error handled by error middleware', async () => {
    const response = await request(app).get('/price-index/invalid_pair');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid pair');
  });

  it('should log requests via logHandler middleware', async () => {
    const response = await request(app).get('/price-index');
    expect(response.status).toBeDefined();
    expect(logHandler).toHaveBeenCalled();
  });

  it('should return price index for valid pair', async () => {
    const response = await request(app).get('/price-index/BTC-USDT');
    expect(response.status).toBe(200);
    expect(response.body.pair).toEqual({ asset: 'BTC', quote: 'USDT' });
    expect(response.body.price).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });
});