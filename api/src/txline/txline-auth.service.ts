import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface GuestStartResponse {
  token: string;
}

interface ActivateTokenResponse {
  apiToken?: string;
  token?: string;
}

export interface ActivateTokenInput {
  txSig: string;
  walletSignature: string;
  leagues: string[];
}

/**
 * TxLINE auth: guest JWT (POST /auth/guest/start, valid ~30 days) + API token.
 * Free tier: set TXLINE_JWT/TXLINE_API_TOKEN via env, or leave TXLINE_JWT blank
 * to auto-fetch a guest JWT and refresh it on 401. See docs/txline-provider.md.
 */
@Injectable()
export class TxlineAuthService {
  private readonly logger = new Logger(TxlineAuthService.name);
  private jwt: string | null = null;

  constructor(private readonly config: ConfigService) {}

  get baseUrl(): string {
    return this.config.get<string>('TXLINE_BASE_URL') ?? 'https://txline.txodds.com';
  }

  private get apiToken(): string {
    return this.config.get<string>('TXLINE_API_TOKEN') ?? '';
  }

  hasApiToken(): boolean {
    return this.apiToken.length > 0;
  }

  /** Cached JWT, env JWT, or a freshly fetched guest JWT (in that order). */
  async getJwt(): Promise<string> {
    if (this.jwt) return this.jwt;
    const fromEnv = this.config.get<string>('TXLINE_JWT');
    if (fromEnv) {
      this.jwt = fromEnv;
      return fromEnv;
    }
    return this.refreshGuestJwt();
  }

  /** POST /auth/guest/start (empty body) → { token }. Caches the JWT in memory. */
  async refreshGuestJwt(): Promise<string> {
    const { data } = await axios.post<GuestStartResponse>(`${this.baseUrl}/auth/guest/start`, {});
    this.jwt = data.token;
    this.logger.log('acquired guest JWT (valid ~30 days)');
    return this.jwt;
  }

  /** Both required headers for every data request. */
  async getHeaders(): Promise<Record<string, string>> {
    return {
      Authorization: `Bearer ${await this.getJwt()}`,
      'X-Api-Token': this.apiToken,
    };
  }

  /** POST /api/token/activate — free tier still activates (no payment). Phase-2 wallet flow. */
  async activateToken(input: ActivateTokenInput): Promise<string> {
    const { data } = await axios.post<ActivateTokenResponse>(
      `${this.baseUrl}/api/token/activate`,
      input,
      { headers: { Authorization: `Bearer ${await this.getJwt()}` } },
    );
    return data.apiToken ?? data.token ?? '';
  }
}
