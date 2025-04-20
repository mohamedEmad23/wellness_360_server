import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsDateString,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: ['male', 'female'], example: 'male' })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: 'male' | 'female';

  @ApiPropertyOptional({ 
    example: '2004-01-20',
    description: 'Date of birth in YYYY-MM-DD format' 
  })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'Date must be in format YYYY-MM-DD' 
  })
  dob?: Date;

  @ApiPropertyOptional({ example: 22 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({ example: 175, description: 'Height in centimeters' })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({ example: 70, description: 'Weight in kilograms' })
  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({
    enum: ['sedentary', 'lightly active', 'moderately active', 'very active'],
    example: 'moderately active',
  })
  @IsOptional()
  @IsEnum(['sedentary', 'lightly active', 'moderately active', 'very active'])
  activityLevel?: 'sedentary' | 'lightly active' | 'moderately active' | 'very active';

  @ApiPropertyOptional({
    enum: ['lose', 'maintain', 'gain'],
    example: 'maintain',
  })
  @IsOptional()
  @IsEnum(['lose', 'maintain', 'gain'])
  goal?: 'lose' | 'maintain' | 'gain';

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(10000)
  dailyCalories?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  caloriesLeft?: number;
} 