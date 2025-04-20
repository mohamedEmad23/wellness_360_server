import { IsString,IsMongoId, IsOptional,IsNumber,IsDate,Min,Max } from 'class-validator';

export class createSleepLogDTO{

    @IsMongoId()
    userID:string

    @IsDate()
    startTime:Date

    @IsDate()
    endTime:Date

    @Min(1)
    @Max(5)
    @IsNumber()
    Rating:Number

    @IsOptional()
    Notes:String

}