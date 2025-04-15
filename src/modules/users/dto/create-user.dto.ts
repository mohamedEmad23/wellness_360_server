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
  IsDateString,
} from 'class-validator';

export class CreateUserDto {
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

  @ApiPropertyOptional({ enum: ['male', 'female'], example: 'male' })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: 'male' | 'female';

  @ApiPropertyOptional({ example: '2002-05-20' })
  @IsOptional()
  @IsDateString()
  dob?: Date;

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

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  dailyCalories?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsNumber()
  caloriesLeft?: number;

  // OTP related fields
  currentOtp?: string;
  emailVerificationOtpCreatedAt?: Date;
  emailVerificationOtpExpiresAt?: Date;
  isEmailVerified?: boolean;

  constructor(partial: Partial<CreateUserDto> = {}) {
    Object.assign(this, partial);
  }
}
