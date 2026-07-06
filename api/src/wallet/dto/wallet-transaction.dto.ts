import { ApiProperty } from '@nestjs/swagger';
import { WalletTxType, type WalletTransaction } from '@prisma/client';

export class WalletTransactionDto {
  @ApiProperty({ description: 'Transaction id (cuid)' })
  id!: string;

  @ApiProperty({ description: 'Movement kind', enum: WalletTxType })
  type!: WalletTxType;

  @ApiProperty({
    description: 'Signed amount as a decimal string (positive = credit)',
    example: '250.00',
  })
  amount!: string;

  @ApiProperty({
    description: 'Balance right after this movement',
    example: '28105820.00',
  })
  balanceAfter!: string;

  @ApiProperty({
    description: 'What the movement references (e.g. bet, listing)',
    nullable: true,
    type: String,
  })
  refType!: string | null;

  @ApiProperty({ description: 'Referenced entity id', nullable: true, type: String })
  refId!: string | null;

  @ApiProperty({ description: 'When it happened' })
  createdAt!: Date;

  static fromEntity(tx: WalletTransaction): WalletTransactionDto {
    const dto = new WalletTransactionDto();
    dto.id = tx.id;
    dto.type = tx.type;
    dto.amount = tx.amount.toFixed(2);
    dto.balanceAfter = tx.balanceAfter.toFixed(2);
    dto.refType = tx.refType;
    dto.refId = tx.refId;
    dto.createdAt = tx.createdAt;
    return dto;
  }
}
