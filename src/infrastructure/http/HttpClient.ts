import axios, { AxiosInstance, isAxiosError } from 'axios';
import { logger } from '../logging/logger';

export class HttpClient {
  private readonly client: AxiosInstance;

  constructor(url: string) {
    this.client = axios.create({
      baseURL: url,
      timeout: 10000,
    });

  }

  public configure() {
    this.client.interceptors.request.use((config) => {
      logger.info(`Request to ${config.url}`);
      return config;
    }, function (error) {
      logger.error(`Request error: ${error.message}`);
      return Promise.reject(error);
    });

    this.client.interceptors.response.use((response) => {
      logger.info(`Response from ${response.config.url}`);
      return response;
    }, function (error) {
      logger.error(`Response error: ${error.message}`);
      return Promise.reject(error);
    });
  }

  public async get<T>(url: string, params?: Record<string, any>, headers?: Record<string, any>): Promise<T> {
    try {
      const response = await this.client.get<T>(url, { params, headers });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: any): never {
    if (isAxiosError(error)) {
      logger.error(`Axios error: ${error.message}`);
      if (error.response) {
        logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
    } else {
      logger.error(`Unexpected error: ${error}`);
    }
    throw error;
  }
}