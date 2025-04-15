import { Document } from 'mongoose';
import { User } from '../schemas/user.schema';
export declare class sleepLog extends Document {
    userID: User;
    startTime: Date;
    endTime: Date;
    Duration: number;
    Rating: Number;
    Notes: String;
}
export declare const sleepLogSchema: import("mongoose").Schema<sleepLog, import("mongoose").Model<sleepLog, any, any, any, Document<unknown, any, sleepLog> & sleepLog & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, sleepLog, Document<unknown, {}, import("mongoose").FlatRecord<sleepLog>> & import("mongoose").FlatRecord<sleepLog> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
