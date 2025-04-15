import { Model, Types } from 'mongoose';
import { sleepLogInterface } from './interfaces/sleepLog.interface';
import { createSleepLogDTO } from './dto/create-sleepLog.dto';
import { updateSleepLogDTO } from './dto/update-sleepLog.dto';
export declare class SleepService {
    private readonly sleepLogModel;
    constructor(sleepLogModel: Model<sleepLogInterface>);
    create(id: Types.ObjectId, data: createSleepLogDTO): Promise<sleepLogInterface>;
    update(id: Types.ObjectId, userID: string, updateData: updateSleepLogDTO): Promise<string>;
    delete(id: Types.ObjectId, userID: string): Promise<string>;
    getLogs(id: string): Promise<(import("mongoose").Document<unknown, {}, sleepLogInterface> & sleepLogInterface & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    avgDuration(id: string): Promise<{
        avg_duration: any;
    }>;
    avgRating(id: string): Promise<{
        avg_rating: any;
    }>;
}
