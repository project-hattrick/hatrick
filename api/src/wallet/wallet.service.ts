import { Injectable } from '@nestjs/common';

import { WalletRepository } from '../users/repositories';
import { WalletTransactionDto } from './dto/wallet-transaction.dto';

@Injectable()
export class WalletService {
  constructor(private readonly wallet: WalletRepository) {}

  /** Recent ledger entries for a user, newest first. */
  async history(userId: string, take = 50): Promise<WalletTransactionDto[]> {
    const rows = await this.wallet.findByUser(userId, take);
    return rows.map((row) => WalletTransactionDto.fromEntity(row));
  }
}
