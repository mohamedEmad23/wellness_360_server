import { IsMongoId, IsNotEmpty, IsNumber, Min, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserActivityDto {
  @ApiProperty({
    description: 'ID of the activity being logged',
    example: '6618e456f54a4a67f4d36c9b',
  })
  @IsMongoId()
  @IsNotEmpty()
  activityId: string;

  @ApiProperty({
    description: 'Duration of the activity in minutes',
    example: 30,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Activity title',
    example: 'Morning Run',
  })
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Date of the activity (ISO string)',
    example: '2024-03-20T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
