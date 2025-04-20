import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class LogFoodDto {
  @ApiProperty({ description: 'Description of the food intake', example: 'An apple and two cheeseburgers' })
  @IsString()
  description: string;
}

export class LogFoodByInfoDto {
  @ApiProperty({ description: 'Food ID', example: '1234567890' })
  @IsString()
  foodId: string;

  @ApiProperty({ description: 'Measure URI', example: '1234567890' })
  @IsString()
  measureURI: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Title', example: 'An apple and two cheeseburgers' })
  @IsString()
  title: string;
}
