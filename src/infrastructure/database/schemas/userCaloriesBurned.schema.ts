import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserCaloriesBurnedDocument = UserCaloriesBurned & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class UserCaloriesBurned {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, default: 0 })
  dailyCaloriesBurned: number;
  
  @Prop({ required: true, default: 0 })
  weeklyCaloriesBurned: number;
  
  @Prop({ required: true, default: 0 })
  monthlyCaloriesBurned: number;
  
  @Prop({ required: true, default: 0 })
  totalCaloriesBurned: number;
  
  @Prop({ required: true })
  date: Date;
  
  @Prop({ type: [Object], default: [] })
  workoutSessions: {
    workoutId: string;
    workoutDay: string;
    caloriesBurned: number;
    date: Date;
  }[];
}

export const UserCaloriesBurnedSchema = SchemaFactory.createForClass(UserCaloriesBurned); 