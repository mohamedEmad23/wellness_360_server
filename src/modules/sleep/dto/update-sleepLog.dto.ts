import { IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class updateSleepLogDTO {
    @ApiProperty({
        description: 'When sleep started',
        example: '2025-04-13T22:00:00Z',
        required: false
    })
    @IsDateString()
    @IsOptional()
    startTime?: string;

    @ApiProperty({
        description: 'When sleep ended',
        example: '2025-04-14T06:30:00Z',
        required: false
    })
    @IsDateString()
    @IsOptional()
    endTime?: string;

    @ApiProperty({
        description: 'Sleep quality rating (1-5)',
        example: 4,
        minimum: 1,
        maximum: 5,
        required: false
    })
    @Min(1)
    @Max(5)
    @IsNumber()
    @IsOptional()
    rating?: number;

    @ApiProperty({
        description: 'Additional notes about sleep',
        example: 'Updated: Great sleep, felt refreshed',
        required: false
    })
    @IsString()
    @IsOptional()
    notes?: string;
}