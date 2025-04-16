import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class SleepLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userID: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true, enum: [1, 2, 3, 4, 5], default: 3 })
  rating: number;

  @Prop()
  notes?: string;
}

export const SleepLogSchema = SchemaFactory.createForClass(SleepLog);
