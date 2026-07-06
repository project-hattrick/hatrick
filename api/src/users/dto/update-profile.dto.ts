import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * Self-service profile edit (PATCH /users/:id). Deliberately narrow — only the
 * user-editable identity fields, never walletAddress/email/role/balance (those
 * are set by sign-in / the ledger, not the profile form).
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'Public display name', maxLength: 32 })
  @IsString()
  @IsOptional()
  @MaxLength(32)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Unique handle (letters, numbers, underscore)',
    maxLength: 24,
  })
  @IsString()
  @IsOptional()
  @MaxLength(24)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'username may only contain letters, numbers and underscores',
  })
  username?: string;

  @ApiPropertyOptional({ description: 'Country the user represents', maxLength: 56 })
  @IsString()
  @IsOptional()
  @MaxLength(56)
  country?: string;

  @ApiPropertyOptional({ description: 'Short bio', maxLength: 280 })
  @IsString()
  @IsOptional()
  @MaxLength(280)
  bio?: string;

  @ApiPropertyOptional({
    description: 'Avatar source — a preset path (/personas/*) or image URL',
    maxLength: 512,
  })
  @IsString()
  @IsOptional()
  @MaxLength(512)
  portraitSrc?: string;
}
