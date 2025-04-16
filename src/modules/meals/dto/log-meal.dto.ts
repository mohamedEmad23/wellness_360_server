// log-meal.dto.ts
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class LogMealDto {
  @IsString()
  foodName: string;

  @IsOptional()
  @IsDateString()
  date?: string; // Will be parsed as a date
}
