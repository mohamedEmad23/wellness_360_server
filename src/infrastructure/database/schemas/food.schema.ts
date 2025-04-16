import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FoodDocument = Food & Document;

@Schema({ timestamps: true })
export class Food {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  calories: number;

  @Prop()
  protein?: number;

  @Prop()
  carbs?: number;

  @Prop()
  fats?: number;

  @Prop({ enum: ['breakfast', 'lunch', 'dinner', 'snack', 'cheat meal'], required: true })
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'cheat meal';

  @Prop({ default: false })
  isCustom?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const FoodSchema = SchemaFactory.createForClass(Food);
