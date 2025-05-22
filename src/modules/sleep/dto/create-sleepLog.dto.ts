import { IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class createSleepLogDTO {
    @ApiProperty({
        description: 'When sleep started',
        example: '2025-04-13T22:00:00Z'
    })
    @IsDateString()
    startTime: string;

    @ApiProperty({
        description: 'When sleep ended',
        example: '2025-04-14T06:30:00Z'
    })
    @IsDateString()
    endTime: string;

    @ApiProperty({
        description: 'Sleep quality rating (1-5)',
        example: 4,
        minimum: 1,
        maximum: 5
    })
    @Min(1)
    @Max(5)
    @IsNumber()
    rating: number;

    @ApiProperty({
        description: 'Additional notes about sleep',
        example: 'Good sleep, woke up refreshed',
        required: false
    })
    @IsString()
    @IsOptional()
    notes?: string;
}