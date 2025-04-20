import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFoodLogDto {
  @ApiProperty({ description: 'Name of the food item' })
  @IsString()
  foodName: string;

  @ApiProperty({ description: 'Title of the food item' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Calories in the food item' })
  @IsNumber()
  calories: number;

  @ApiProperty({ description: 'Protein content in grams' })
  @IsNumber()
  protein: number;

  @ApiProperty({ description: 'Carbohydrate content in grams' })
  @IsNumber()
  carbs: number;

  @ApiProperty({ description: 'Fat content in grams' })
  @IsNumber()
  fats: number;

  @ApiProperty({ description: 'Date of the food log', required: false })
  @IsOptional()
  @IsDate()
  date?: Date;
}
