import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin auth seam. For the hackathon free tier, set TXLINE_JWT and
 * TXLINE_API_TOKEN via env. Swap `refreshGuestJwt` to call
 * `POST /auth/guest/start` when wiring live credentials (docs/txline-provider.md).
 */
@Injectable()
export class TxlineAuthService {
  private readonly logger = new Logger(TxlineAuthService.name);

  constructor(private readonly config: ConfigService) {}

  get baseUrl(): string {
    return this.config.get<string>('TXLINE_BASE_URL') ?? 'https://txline.txodds.com';
  }

  getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.get<string>('TXLINE_JWT') ?? ''}`,
      'X-Api-Token': this.config.get<string>('TXLINE_API_TOKEN') ?? '',
    };
  }

  async refreshGuestJwt(): Promise<void> {
    // TODO: POST `${this.baseUrl}/auth/guest/start` → { token }; persist + reuse.
    this.logger.warn('refreshGuestJwt() not implemented — using env TXLINE_JWT');
  }
}
