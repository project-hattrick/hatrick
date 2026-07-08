import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

import { TxlineAuthService } from './txline-auth.service';

const MAX_ATTEMPTS = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Shared TxLINE REST client. Injects the two auth headers and is resilient by
 * design (the provider's edge times out / rate-limits under load): on 401 it
 * refreshes the guest JWT and retries; on transient failures (network, 5xx, 429,
 * timeout) it retries with backoff. All REST traffic funnels through here so
 * provider concerns stay isolated (docs/conventions.md).
 */
@Injectable()
export class TxlineHttpService {
  private readonly logger = new Logger(TxlineHttpService.name);

  constructor(private readonly auth: TxlineAuthService) {}

  private async client(): Promise<AxiosInstance> {
    return axios.create({
      baseURL: this.auth.baseUrl,
      headers: await this.auth.getHeaders(),
      timeout: 30_000,
    });
  }

  private transient(err: AxiosError): boolean {
    const status = err.response?.status;
    if (status === undefined) return true; // network error / timeout / aborted
    return status === 429 || status >= 500;
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { data } = await (await this.client()).get<T>(path, config);
        return data;
      } catch (err) {
        lastErr = err;
        const axErr = err as AxiosError;
        if (axErr.response?.status === 401) {
          await this.auth.refreshGuestJwt(); // stale JWT — refresh and retry immediately
          continue;
        }
        if (this.transient(axErr) && attempt < MAX_ATTEMPTS) {
          const delay = 300 * 2 ** (attempt - 1);
          this.logger.warn(`GET ${path} failed (${axErr.response?.status ?? axErr.code ?? 'network'}) — retry ${attempt}/${MAX_ATTEMPTS - 1} in ${delay}ms`);
          await sleep(delay);
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }
}
