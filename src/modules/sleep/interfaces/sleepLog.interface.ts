import { Document,Types } from 'mongoose';

export interface sleepLogInterface extends Document {
    userID: Types.ObjectId;
    startTime: Date;
    endTime: Date;
    Duration:Number
    Notes?:string
    created_at: Date;
}
