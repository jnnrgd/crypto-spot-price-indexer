import axios, { AxiosError, AxiosInstance, CreateAxiosDefaults } from 'axios';
import { logger } from '../../../src/infrastructure/logging/logger';
import { HttpClient } from '../../../src/infrastructure/http/HttpClient';

jest.mock('axios');
jest.mock('../../../src/infrastructure/logging/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('HttpClient', () => {
  const mockBaseUrl = 'https://api.example.com';
  const headers = { 'Authorization': 'Bearer token' };
  let httpClient: HttpClient;
  let mockAxiosInstance: jest.Mocked<AxiosInstance>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      get: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn()
        },
        response: {
          use: jest.fn()
        }
      }
    } as unknown as jest.Mocked<AxiosInstance>;

    (axios.create as jest.MockedFunction<typeof axios.create>).mockReturnValue(mockAxiosInstance);

    httpClient = new HttpClient(mockBaseUrl);
    httpClient.configure();
  });

  describe('Configure Interceptors', () => {
    it('should set up request interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should set up response interceptors', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should make successful GET request', async () => {
      const mockResponseData = { id: 1, name: 'Test' };
      const mockResponse = { data: mockResponseData };

      (mockAxiosInstance.get as jest.MockedFunction<typeof mockAxiosInstance.get>)
        .mockResolvedValue(mockResponse);

      const result = await httpClient.get(mockBaseUrl);

      expect(result).toEqual(mockResponseData);
    });

    it('should handle Axios error', async () => {
      const mockAxiosError: AxiosError = {
        isAxiosError: true,
        message: 'Network Error',
        response: {
          data: { error: 'Something went wrong' },
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any
        },
        config: {} as any,
        name: 'AxiosError',
        toJSON: () => ({})
      };

      (mockAxiosInstance.get as jest.MockedFunction<typeof mockAxiosInstance.get>)
        .mockRejectedValue(mockAxiosError);

      await expect(httpClient.get(mockBaseUrl)).rejects.toEqual(mockAxiosError);
    });

    it('should handle unexpected error', async () => {
      const unexpectedError = new Error('Unexpected error');

      (mockAxiosInstance.get as jest.MockedFunction<typeof mockAxiosInstance.get>)
        .mockRejectedValue(unexpectedError);

      await expect(httpClient.get(mockBaseUrl)).rejects.toEqual(unexpectedError);

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Unexpected error'));
    });
  });
});
