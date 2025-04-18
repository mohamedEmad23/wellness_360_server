import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LogFoodDto {
  @ApiProperty({ description: 'Description of the food intake', example: 'An apple and two cheeseburgers' })
  @IsString()
  description: string;
}
