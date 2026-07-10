import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class EmailSignInDto {
  @ApiProperty({
    description: 'Account email — registers a Collector on first sign-in',
    example: 'collector@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Account password', minLength: 8, maxLength: 72 })
  @IsString()
  @Length(8, 72)
  password!: string;
}
