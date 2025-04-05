import { Document } from 'mongoose';
export declare class User extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    currentOtp?: string;
    emailVerificationOtpCreatedAt?: Date;
    emailVerificationOtpExpiresAt?: Date;
    isEmailVerified: boolean;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User> & User & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>> & import("mongoose").FlatRecord<User> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
