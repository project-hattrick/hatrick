import { Injectable } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

import { TxlineAuthService } from './txline-auth.service';

/**
 * Shared TxLINE REST client: injects the two auth headers and, on a 401,
 * refreshes the guest JWT and retries the request once. All REST traffic to
 * TxLINE flows through here so provider concerns stay isolated (docs/conventions.md).
 */
@Injectable()
export class TxlineHttpService {
  constructor(private readonly auth: TxlineAuthService) {}

  private async client(): Promise<AxiosInstance> {
    return axios.create({
      baseURL: this.auth.baseUrl,
      headers: await this.auth.getHeaders(),
      timeout: 30_000,
    });
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const { data } = await (await this.client()).get<T>(path, config);
      return data;
    } catch (err) {
      if ((err as AxiosError).response?.status !== 401) throw err;
      await this.auth.refreshGuestJwt();
      const { data } = await (await this.client()).get<T>(path, config);
      return data;
    }
  }
}
