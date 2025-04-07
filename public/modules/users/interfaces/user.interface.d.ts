import { Document } from 'mongoose';
export interface User extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    currentOtp?: string;
    emailVerificationOtpCreatedAt?: Date;
    emailVerificationOtpExpiresAt?: Date;
    isEmailVerified: boolean;
    created_at: Date;
}
