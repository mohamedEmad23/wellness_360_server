import { Document } from 'mongoose';
import { NotificationPriority, NotificationType } from '../../../infrastructure/database/schemas/notification.schema';

export interface NotificationInterface extends Document {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  actionLink?: string;
  metadata?: Record<string, any>;
  active: boolean;
  scheduledFor?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
} 