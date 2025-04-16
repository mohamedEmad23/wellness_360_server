import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  currentOtp?: string;

  @Prop()
  emailVerificationOtpCreatedAt?: Date;

  @Prop()
  emailVerificationOtpExpiresAt?: Date;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  gender?: 'male' | 'female';

  @Prop()
  dob?: Date;

  @Prop()
  age?: number;

  @Prop({ required: true })
  height: number; // in cm

  @Prop({ required: true })
  weight: number; // in kg

  @Prop({ enum: ['sedentary', 'lightly active', 'moderately active', 'very active'], default: 'sedentary' })
  activityLevel?: string;

  @Prop({ default: 'maintain' })
  goal?: 'lose' | 'maintain' | 'gain';

  @Prop({ default: 3000 })
  dailyCalories?: number;

  @Prop({ default: function () { return this.dailyCalories; } })
  caloriesLeft?: number;
  
  // Macronutrient tracking
  @Prop({ default: 150 }) // you can adjust based on weight/goal
  dailyProtein?: number;

  @Prop({ default: 200 })
  dailyCarbs?: number;

  @Prop({ default: 70 })
  dailyFats?: number;

  @Prop({ default: function () { return this.dailyProtein; } })
  proteinLeft?: number;

  @Prop({ default: function () { return this.dailyCarbs; } })
  carbsLeft?: number;

  @Prop({ default: function () { return this.dailyFats; } })
  fatsLeft?: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
