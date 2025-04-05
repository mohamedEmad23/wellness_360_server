import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code sent to user email',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;

  constructor(partial: Partial<VerifyEmailDto> = {}) {
    Object.assign(this, partial);
  }
}
