import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, Document } from 'mongoose';
import { Activity } from './activity.schema';
import { User } from './user.schema';

@Schema({ timestamps: true })
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
}

export interface UserActivityDocument extends UserActivity, Document {
  createdAt: Date;
  updatedAt: Date;
}

export const UserActivitySchema = SchemaFactory.createForClass(UserActivity);
