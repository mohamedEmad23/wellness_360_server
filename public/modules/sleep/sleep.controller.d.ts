import { SleepService } from './sleep.service';
import { createSleepLogDTO } from '../sleep/dto/create-sleepLog.dto';
import { updateSleepLogDTO } from '../sleep/dto/update-sleepLog.dto';
import { sleepLogInterface } from './interfaces/sleepLog.interface';
import { Types } from 'mongoose';
export declare class SleepController {
    private sleepService;
    constructor(sleepService: SleepService);
    getAVGtime(req: any): Promise<{
        avg_duration: any;
    }>;
    getAVGrating(req: any): Promise<{
        avg_rating: any;
    }>;
    getLogs(req: any): Promise<(import("mongoose").Document<unknown, {}, sleepLogInterface> & sleepLogInterface & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    addLog(req: any, data: createSleepLogDTO): Promise<sleepLogInterface>;
    deleteLog(req: any, id: Types.ObjectId): Promise<string>;
    updateLog(req: any, id: Types.ObjectId, updateData: updateSleepLogDTO): Promise<string>;
}
