import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserMacrosDocument = UserMacros & Document;


@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class UserMacros {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  dailyCalories: number;
  
  @Prop({ required: true })
  caloriesLeft: number;

  @Prop({ required: true })
  dailyProtein: number;

  @Prop({ required: true })
  proteinLeft: number;

  @Prop({ required: true })
  dailyCarbs: number;

  @Prop({ required: true })
  carbsLeft: number;

  @Prop({ required: true })
  dailyFat: number;

  @Prop({ required: true })
  fatLeft: number;

  @Prop({ required: true })
  date: Date;
}

export const UserMacrosSchema = SchemaFactory.createForClass(UserMacros);
