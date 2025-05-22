import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  MinLength,
  IsEnum,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: ['male', 'female'], example: 'male' })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: 'male' | 'female';

  @ApiPropertyOptional({ example: 22 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  age?: number;

  @ApiProperty({ example: 175, description: 'Height in centimeters' })
  @IsNumber()
  @Min(50)
  height: number;

  @ApiProperty({ example: 70, description: 'Weight in kilograms' })
  @IsNumber()
  @Min(20)
  weight: number;

  @ApiPropertyOptional({
    enum: ['sedentary', 'lightly active', 'moderately active', 'very active'],
    example: 'moderately active',
  })
  @IsOptional()
  @IsEnum(['sedentary', 'lightly active', 'moderately active', 'very active'])
  activityLevel?: string;

  @ApiPropertyOptional({
    enum: ['lose', 'maintain', 'gain'],
    example: 'maintain',
  })
  @IsOptional()
  @IsEnum(['lose', 'maintain', 'gain'])
  goal?: 'lose' | 'maintain' | 'gain';

  constructor(partial: Partial<RegisterDto> = {}) {
    Object.assign(this, partial);
  }
}
