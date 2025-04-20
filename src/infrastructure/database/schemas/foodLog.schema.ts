import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FoodLogDocument = FoodLog & Document;

@Schema()
export class FoodLog {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  title: string;
  @Prop({ required: true })
  foodName: string;

  @Prop({ required: true })
  calories: number;

  @Prop({ required: true })
  protein: number;

  @Prop({ required: true })
  carbs: number;

  @Prop({ required: true })
  fats: number;

  @Prop({ default: Date.now })
  date: Date;
}

export const FoodLogSchema = SchemaFactory.createForClass(FoodLog);