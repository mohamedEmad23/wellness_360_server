import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { User } from './user.schema';
import { Food } from './food.schema';

export type FoodLogDocument = FoodLog & Document;

@Schema({ _id: false })
export class FoodEntry {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true })
  food: Food;

  @Prop({ required: true, default: 1 })
  quantity: number;

  @Prop({ default: () => new Date() })
  eatenAt: Date;
}

const FoodEntrySchema = SchemaFactory.createForClass(FoodEntry);

@Schema({ timestamps: true })
export class FoodLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId | User;

  @Prop({ type: [FoodEntrySchema], default: [] })
  entries: FoodEntry[];
}

export const FoodLogSchema = SchemaFactory.createForClass(FoodLog);
