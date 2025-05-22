import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  WORKOUT_REMINDER = 'workout_reminder',
  SLEEP_REMINDER = 'sleep_reminder',
  GOAL_ACHIEVED = 'goal_achieved',
  WATER_REMINDER = 'water_reminder',
  ACTIVITY_REMINDER = 'activity_reminder',
  SYSTEM = 'system',
  CUSTOM = 'custom'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: NotificationType, default: NotificationType.SYSTEM })
  type: string;

  @Prop({ enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  priority: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: null })
  actionLink: string;
  
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
  
  @Prop({ default: true })
  active: boolean;

  @Prop({ default: null })
  scheduledFor: Date;
  
  @Prop({ default: null })
  expiresAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification); 