import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserMacrosDto {
  @ApiProperty({ description: 'The daily amount of calories the user should consume' })
  @IsNumber()
  @Min(0)
  dailyCalories: number;
}
