import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  FitnessGoal,
  FitnessLevel,
} from '../../../infrastructure/database/schemas/fitness-profile.schema';

export class CreateFitnessProfileDto {
  @ApiProperty({
    enum: FitnessLevel,
    default: FitnessLevel.BEGINNER,
    description: 'User fitness level',
    example: FitnessLevel.BEGINNER,
  })
  @IsEnum(FitnessLevel, {
    message: `fitnessLevel must be one of the following values: ${Object.values(FitnessLevel).join(', ')}`,
  })
  fitnessLevel: FitnessLevel;

  @ApiProperty({
    enum: FitnessGoal,
    isArray: true,
    description: 'User fitness goals',
    example: [FitnessGoal.WEIGHT_LOSS, FitnessGoal.ENDURANCE],
  })
  @IsArray()
  @IsEnum(FitnessGoal, {
    each: true,
    message: `Each goal must be one of the following values: ${Object.values(FitnessGoal).join(', ')}`,
  })
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
    description: 'User target weight in kilograms',
    example: 65,
    minimum: 20,
    maximum: 350,
  })
  @IsNumber()
  @Min(20, { message: 'Target weight must be at least 20 kg' })
  @Max(350, { message: 'Target weight must be less than 350 kg' })
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
    minimum: 1,
    maximum: 7,
    default: 3,
  })
  @IsNumber()
  @Min(1, { message: 'Available workout days must be at least 1' })
  @Max(7, { message: 'Available workout days cannot exceed 7' })
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
  @Min(15, { message: 'Workout duration must be at least 15 minutes' })
  @Max(120, { message: 'Workout duration must be less than 120 minutes' })
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
