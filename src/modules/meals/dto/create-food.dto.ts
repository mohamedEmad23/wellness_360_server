import { IsEnum, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFoodDto {
  @ApiProperty({
    description: 'Name of the food',
    example: 'Banana',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the food item',
    example: 'A ripe banana',
  })
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Calories in the food item',
    example: 105,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  calories: number;

  @ApiProperty({
    description: 'Amount of protein in the food item (optional)',
    example: 1.3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  protein?: number;

  @ApiProperty({
    description: 'Amount of carbs in the food item (optional)',
    example: 27,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  carbs?: number;

  @ApiProperty({
    description: 'Amount of fats in the food item (optional)',
    example: 0.3,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  fats?: number;

  @ApiProperty({
    description: 'Type of food (breakfast, lunch, dinner, snack, cheat meal)',
    example: 'breakfast',
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'cheat meal'],
  })
  @IsEnum(['breakfast', 'lunch', 'dinner', 'snack', 'cheat meal'])
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'cheat meal';

  @ApiProperty({
    description: 'Whether the food is custom created by the user',
    example: true,
    required: false,
  })
  @IsOptional()
  isCustom?: boolean;
}
