import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { Activity } from './activity.schema';
import { User } from './user.schema';

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class UserActivity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId | User;

  @Prop({ type: Types.ObjectId, ref: 'Activity', required: true })
  activity: Types.ObjectId | Activity;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  duration: number; // in minutes

  @Prop()
  caloriesBurned?: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export interface UserActivityDocument extends UserActivity, Document {}

export const UserActivitySchema = SchemaFactory.createForClass(UserActivity);
