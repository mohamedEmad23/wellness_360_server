import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserMacrosDto {

  @ApiProperty({ description: 'The user id' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'The daily amount of calories the user should consume' })
  @IsNumber()
  dailyCalories: number;
}
