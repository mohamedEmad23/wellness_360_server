import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType } from '../../infrastructure/database/schemas/notification.schema';
import { NotificationInterface } from './interfaces/notification.interface';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { SchedulerRegistry } from '@nestjs/schedule';
import { NotificationsGateway } from './notification.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationInterface>,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly notificationsGateway: NotificationsGateway
  ) {}

  /**
   * Create a new notification
   */
  async create(createNotificationDto: CreateNotificationDto): Promise<NotificationInterface> {
    const notification = new this.notificationModel(createNotificationDto);
    const savedNotification = await notification.save();

    // Handle scheduled notifications
    if (createNotificationDto.scheduledFor) {
      this.scheduleNotification(savedNotification);
    } else {
      // Immediately send notification if not scheduled
      this.sendRealTimeNotification(savedNotification);
    }

    return savedNotification;
  }

  /**
   * Schedule a notification for future delivery
   */
  private scheduleNotification(notification: NotificationInterface): void {
    if (!notification.scheduledFor) return;
    
    const scheduledTime = new Date(notification.scheduledFor);
    const now = new Date();
    
    if (scheduledTime <= now) {
      // If schedule time is in the past or now, send immediately
      this.sendRealTimeNotification(notification);
      return;
    }
    
    const timeoutMs = scheduledTime.getTime() - now.getTime();
    const notificationId = notification._id.toString();
    
    const timeout = setTimeout(() => {
      this.sendScheduledNotification(notificationId);
    }, timeoutMs);
    
    try {
      this.schedulerRegistry.addTimeout(`notification_${notificationId}`, timeout);
    } catch (error) {
      // Ignore if scheduling fails
    }
  }

  /**
   * Send a scheduled notification when its time arrives
   */
  private async sendScheduledNotification(notificationId: string): Promise<void> {
    try {
      const notification = await this.notificationModel.findById(notificationId).exec();
      
      if (!notification || !notification.active) {
        return;
      }
      
      // Update notification to reflect it's been processed
      notification.scheduledFor = null;
      await notification.save();
      
      // Send real-time notification
      this.sendRealTimeNotification(notification);
    } catch (error) {
      // Ignore if sending fails
    }
  }

  /**
   * Send a real-time notification via WebSocket
   */
  private sendRealTimeNotification(notification: NotificationInterface): void {
    try {
      this.notificationsGateway.sendNotificationToUser(
        notification.userId.toString(),
        notification
      );
    } catch (error) {
      // Ignore if sending fails
    }
  }

  /**
   * Find all notifications for a user with optional filtering
   */
  async findAllForUser(
    userId: string, 
    queryParams: QueryNotificationDto
  ): Promise<{ notifications: NotificationInterface[], total: number }> {
    // Extract only pagination params
    const { page = 1, limit = 10 } = queryParams;
    
    // Only filter by userId, no other filters
    const query = { userId: new Types.ObjectId(userId) };
    
    // Get total count for pagination
    const total = await this.notificationModel.countDocuments(query).exec();
    
    // Get paginated results
    const skip = (page - 1) * limit;
    const notifications = await this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    
    return { notifications, total };
  }

  /**
   * Find a notification by ID and verify ownership
   */
  async findOne(id: string, userId: string): Promise<NotificationInterface> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid notification ID');
    }
    
    const notification = await this.notificationModel.findById(id).exec();
    
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    
    // Convert both IDs to strings in a standardized format
    const notificationUserId = notification.userId.toString();
    const requestUserId = new Types.ObjectId(userId).toString();
    
    // Verify ownership using consistent comparison
    if (notificationUserId !== requestUserId) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    
    return notification;
  }

  /**
   * Update a notification
   */
  async update(
    id: string, 
    userId: string, 
    updateNotificationDto: UpdateNotificationDto
  ): Promise<NotificationInterface> {
    await this.findOne(id, userId); // Verify existence and ownership
    
    // Handle rescheduling if scheduledFor is updated
    if (updateNotificationDto.scheduledFor) {
      const existingTimeout = `notification_${id}`;
      try {
        // Clear existing timeout if it exists
        if (this.schedulerRegistry.doesExist('timeout', existingTimeout)) {
          this.schedulerRegistry.deleteTimeout(existingTimeout);
        }
      } catch (error) {
        // Ignore if timeout doesn't exist
      }
    }
    
    const updatedNotification = await this.notificationModel
      .findByIdAndUpdate(id, updateNotificationDto, { new: true })
      .exec();
    
    // Reschedule if needed
    if (updateNotificationDto.scheduledFor && updatedNotification) {
      this.scheduleNotification(updatedNotification);
    }
    
    return updatedNotification;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string, userId: string): Promise<NotificationInterface> {
    return this.update(id, userId, { read: true });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);
    
    const result = await this.notificationModel.updateMany(
      { userId: userObjectId, read: false },
      { $set: { read: true } }
    ).exec();
    
    return result.modifiedCount;
  }

  /**
   * Delete a single notification
   */
  async remove(id: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid notification ID');
    }
    
    const notification = await this.notificationModel.findById(id).exec();
    
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    
    // Convert both IDs to strings in a standardized format
    const notificationUserId = notification.userId.toString();
    const requestUserId = new Types.ObjectId(userId).toString();
    
    // Verify ownership using consistent comparison
    if (notificationUserId !== requestUserId) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    
    // Delete any associated scheduled task
    const timeoutKey = `notification_${id}`;
    try {
      if (this.schedulerRegistry.doesExist('timeout', timeoutKey)) {
        this.schedulerRegistry.deleteTimeout(timeoutKey);
      }
    } catch (error) {
      // Ignore if timeout doesn't exist
    }
    
    await this.notificationModel.findByIdAndDelete(id).exec();
  }

  /**
   * Delete all notifications for a user
   */
  async removeAllForUser(userId: string): Promise<number> {
    const userObjectId = new Types.ObjectId(userId);
    
    // Get all scheduled notifications for the user
    const scheduledNotifications = await this.notificationModel.find({
      userId: userObjectId,
      scheduledFor: { $ne: null }
    }).exec();
    
    // Cancel all scheduled timeouts
    scheduledNotifications.forEach(notification => {
      const timeoutKey = `notification_${notification._id}`;
      try {
        if (this.schedulerRegistry.doesExist('timeout', timeoutKey)) {
          this.schedulerRegistry.deleteTimeout(timeoutKey);
        }
      } catch (error) {
        // Ignore if timeout doesn't exist
      }
    });
    
    // Delete all notifications for the user
    const result = await this.notificationModel.deleteMany({ 
      userId: userObjectId 
    }).exec();
    
    return result.deletedCount;
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
      active: true
    }).exec();
  }
  
  /**
   * Create a system notification for a user
   */
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    options: Partial<CreateNotificationDto> = {}
  ): Promise<NotificationInterface> {
    const notification: CreateNotificationDto = {
      userId,
      title,
      message,
      type: NotificationType.SYSTEM,
      ...options
    };
    
    return this.create(notification);
  }
} 