import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ReauthenticateDto {
  @ApiProperty({
    description: 'Current password of the user',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  currentPassword: string;
}