import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { FitnessGoal, FitnessLevel } from '../../../infrastructure/database/schemas/fitness-profile.schema';

export class CreateFitnessProfileDto {
  @ApiProperty({
    enum: FitnessLevel,
    default: FitnessLevel.BEGINNER,
    description: 'User fitness level',
  })
  @IsEnum(FitnessLevel)
  fitnessLevel: FitnessLevel;

  @ApiProperty({
    enum: FitnessGoal,
    isArray: true,
    description: 'User fitness goals',
    example: [FitnessGoal.WEIGHT_LOSS, FitnessGoal.ENDURANCE],
  })
  @IsArray()
  @IsEnum(FitnessGoal, { each: true })
  fitnessGoals: FitnessGoal[];

  @ApiProperty({
    isArray: true,
    description: 'Preferred fitness activities',
    example: ['running', 'swimming', 'weightlifting'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredActivities?: string[];

  @ApiProperty({
    type: Number,
    description: 'User height in centimeters',
    example: 175,
  })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiProperty({
    type: Number,
    description: 'User weight in kilograms',
    example: 70,
  })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({
    type: Number,
    description: 'User target weight in kilograms',
    example: 65,
  })
  @IsNumber()
  @IsOptional()
  targetWeight?: number;

  @ApiProperty({
    type: Boolean,
    description: 'Whether the user has any injuries',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasInjuries?: boolean;

  @ApiProperty({
    isArray: true,
    description: 'Description of user injuries',
    example: ['lower back pain', 'knee injury'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  injuries?: string[];

  @ApiProperty({
    type: Number,
    description: 'Number of days per week available for working out',
    minimum: 0,
    maximum: 7,
    default: 3,
  })
  @IsNumber()
  @Min(0)
  @Max(7)
  @IsOptional()
  availableWorkoutDays?: number;

  @ApiProperty({
    type: Number,
    description: 'Preferred workout duration in minutes',
    minimum: 15,
    maximum: 120,
    default: 45,
  })
  @IsNumber()
  @Min(15)
  @Max(120)
  @IsOptional()
  preferredWorkoutDuration?: number;

  @ApiProperty({
    type: Boolean,
    description: 'Whether the user has access to a gym',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasGymAccess?: boolean;

  @ApiProperty({
    isArray: true,
    description: 'Equipment available to the user',
    example: ['dumbbells', 'resistance bands', 'yoga mat'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableEquipment?: string[];
}