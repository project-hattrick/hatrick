import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

import { TxlineAuthService } from './txline-auth.service';
import { RawFixture } from './txline.types';

/** Thin REST wrappers for initial-state snapshots (docs/txline-provider.md). */
@Injectable()
export class TxlineSnapshotService {
  constructor(private readonly auth: TxlineAuthService) {}

  private client(): AxiosInstance {
    return axios.create({
      baseURL: this.auth.baseUrl,
      headers: this.auth.getHeaders(),
      timeout: 30_000,
    });
  }

  async getFixtures(competitionId?: number): Promise<RawFixture[]> {
    const { data } = await this.client().get<RawFixture[]>('/api/fixtures/snapshot', {
      params: competitionId ? { competitionId } : undefined,
    });
    return data;
  }
}
