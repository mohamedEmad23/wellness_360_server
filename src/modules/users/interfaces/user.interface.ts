import { Document } from 'mongoose';

export interface User extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  dob: Date;
  age: number;
  height: number;
  weight: number;
  activityLevel: 'sedentary' | 'lightly active' | 'moderately active' | 'very active';
  goal: 'lose' | 'maintain' | 'gain';
  currentOtp?: string;
  emailVerificationOtpCreatedAt?: Date;
  emailVerificationOtpExpiresAt?: Date;
  isEmailVerified: boolean;
  isProfileCompleted: boolean;
  created_at: Date;
}
