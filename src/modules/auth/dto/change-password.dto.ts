import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'New password for the user',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({
    description: 'Reauthentication token received from the reauthenticate endpoint',
  })
  @IsString()
  reauthToken: string;
}