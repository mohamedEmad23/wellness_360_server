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
  WorkoutDifficulty,
  WorkoutType,
} from '../../../infrastructure/database/schemas/workout-plan.schema';

export class GenerateWorkoutPlanDto {
  @ApiProperty({
    enum: WorkoutType,
    description: 'Type of workout to generate',
    example: WorkoutType.STRENGTH,
  })
  @IsEnum(WorkoutType, {
    message: `workoutType must be one of the following values: ${Object.values(WorkoutType).join(', ')}`,
  })
  workoutType: WorkoutType;

  @ApiProperty({
    enum: WorkoutDifficulty,
    description: 'Difficulty level of the workout',
    example: WorkoutDifficulty.INTERMEDIATE,
  })
  @IsEnum(WorkoutDifficulty, {
    message: `difficulty must be one of the following values: ${Object.values(WorkoutDifficulty).join(', ')}`,
  })
  difficulty: WorkoutDifficulty;

  @ApiProperty({
    isArray: true,
    description: 'Fitness goals to focus on',
    example: ['lose weight', 'build muscle', 'improve endurance'],
  })
  @IsArray()
  @IsString({ each: true })
  goals: string[];

  @ApiProperty({
    isArray: true,
    description: 'Specific body areas to target',
    example: ['chest', 'back', 'legs', 'arms', 'core'],
    default: ['full body'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  targetAreas?: string[];

  @ApiProperty({
    type: Number,
    description: 'Number of weeks for the workout plan',
    minimum: 1,
    maximum: 12,
    default: 4,
  })
  @IsNumber()
  @Min(1, { message: 'Plan duration must be at least 1 week' })
  @Max(12, { message: 'Plan duration cannot exceed 12 weeks' })
  duration: number;

  @ApiProperty({
    type: Number,
    description: 'Number of workout days per week',
    minimum: 1,
    maximum: 7,
    default: 3,
  })
  @IsNumber()
  @Min(1, { message: 'Days per week must be at least 1' })
  @Max(7, { message: 'Days per week cannot exceed 7' })
  daysPerWeek: number;

  @ApiProperty({
    type: Number,
    description: 'Target workout time in minutes per session',
    minimum: 15,
    maximum: 120,
    default: 45,
  })
  @IsNumber()
  @Min(15, { message: 'Workout duration must be at least 15 minutes' })
  @Max(120, { message: 'Workout duration must be less than 120 minutes' })
  workoutDuration: number;

  @ApiProperty({
    isArray: true,
    description: 'Equipment available for use',
    example: ['dumbbells', 'bench', 'resistance bands'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableEquipment?: string[];

  @ApiProperty({
    isArray: true,
    description: 'List of injuries or limitations to consider',
    example: ['lower back pain', 'knee injury'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  limitations?: string[];

  @ApiProperty({
    type: Boolean,
    description: 'Whether user has access to a gym',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasGymAccess?: boolean;
}
