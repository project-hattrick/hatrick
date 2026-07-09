import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { StoreItemKind, type StoreItem } from '@prisma/client';

/** A limited-stock store product as the catalog exposes it. */
export class StoreItemDto {
  @ApiProperty({ description: 'Stable product handle', example: 'legendary-pack' })
  slug!: string;

  @ApiProperty({ enum: StoreItemKind })
  kind!: StoreItemKind;

  @ApiProperty({ example: 'Legendary Pack' })
  name!: string;

  @ApiProperty({ description: 'Price in coins (whole)', example: 200000 })
  price!: number;

  @ApiProperty({ description: 'Remaining units — 0 means sold out', example: 12 })
  stock!: number;

  static fromEntity(item: StoreItem): StoreItemDto {
    const dto = new StoreItemDto();
    dto.slug = item.slug;
    dto.kind = item.kind;
    dto.name = item.name;
    dto.price = Number(item.price);
    dto.stock = item.stock;
    return dto;
  }
}

/** Buy one unit of a store item. */
export class PurchaseItemDto {
  @ApiProperty({ description: 'Product handle from the catalog', example: 'legendary-pack' })
  @IsString()
  @MaxLength(64)
  slug!: string;
}

/** Purchase result — new balance (wallet reconcile) + remaining stock. */
export class StorePurchaseResultDto {
  @ApiProperty({ description: 'User balance after the purchase (decimal string)', example: '27905820.00' })
  balance!: string;

  @ApiProperty({ description: 'Units left after this purchase', example: 11 })
  stock!: number;

  @ApiProperty({ example: 'legendary-pack' })
  slug!: string;
}
