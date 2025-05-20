import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
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

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;

  constructor(partial: Partial<ResetPasswordDto> = {}) {
    Object.assign(this, partial);
  }
}