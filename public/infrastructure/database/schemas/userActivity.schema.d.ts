import { Types, Document } from 'mongoose';
import { Activity } from './activity.schema';
import { User } from './user.schema';
export declare class UserActivity {
    user: Types.ObjectId | User;
    activity: Types.ObjectId | Activity;
    title: string;
    duration: number;
    caloriesBurned?: number;
}
export interface UserActivityDocument extends UserActivity, Document {
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserActivitySchema: import("mongoose").Schema<UserActivity, import("mongoose").Model<UserActivity, any, any, any, Document<unknown, any, UserActivity> & UserActivity & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserActivity, Document<unknown, {}, import("mongoose").FlatRecord<UserActivity>> & import("mongoose").FlatRecord<UserActivity> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
