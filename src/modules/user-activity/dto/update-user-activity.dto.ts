import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class UpdateUserActivityDto {
  @ApiProperty({ description: 'The ID of the activity type', required: false })
  @IsOptional()
  @IsString()
  activityId?: string;

  @ApiProperty({ description: 'Duration of the activity in minutes', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({ description: 'Title or note for the activity', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Date of the activity', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;
} 