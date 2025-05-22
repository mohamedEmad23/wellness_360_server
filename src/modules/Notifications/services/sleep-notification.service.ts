import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationsService } from '../notifications.service';
import { 
  NotificationType, 
  NotificationPriority 
} from '../../../infrastructure/database/schemas/notification.schema';
import { User } from '../../../infrastructure/database/schemas/user.schema';
import { SleepLog } from '../../../infrastructure/database/schemas/sleepLog.schema';

@Injectable()
export class SleepNotificationService {
  private readonly logger = new Logger(SleepNotificationService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(SleepLog.name) private sleepLogModel: Model<SleepLog>,
  ) {}

  /**
   * Send nightly sleep reminders to users
   * Runs at 9:00 PM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_9PM)
  async sendNightlySleepReminders() {
    this.logger.log('Running nightly sleep reminder job');
    
    try {
      // Get all active users with completed profiles
      const users = await this.userModel.find({
        isProfileCompleted: true
      }).exec();
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      for (const user of users) {
        const userId = user._id.toString();
        
        // Check if user already logged sleep today
        const todaySleepLog = await this.sleepLogModel.findOne({
          userID: userId,
          startTime: { $gte: today }
        }).exec();
        
        if (!todaySleepLog) {
          // Send sleep reminder only to users who haven't logged sleep today
          await this.notificationsService.create({
            userId,
            title: '😴 Sleep Reminder',
            message: 'Time to wind down for a good night\'s sleep. Don\'t forget to log your sleep tonight!',
            type: NotificationType.SLEEP_REMINDER,
            priority: NotificationPriority.MEDIUM,
            actionLink: '/sleep/log',
          });
          
          this.logger.log(`Sent sleep reminder to user ${userId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error sending sleep reminders: ${error.message}`);
    }
  }
  
  /**
   * Send sleep quality insights 
   * Runs every Monday at 8:00 AM
   */
  @Cron(CronExpression.EVERY_WEEK)
  async sendWeeklySleepInsights() {
    this.logger.log('Running weekly sleep insights job');
    
    try {
      // Get all active users with completed profiles
      const users = await this.userModel.find({
        isProfileCompleted: true
      }).exec();
      
      const now = new Date();
      const weekStart = new Date();
      weekStart.setDate(now.getDate() - 7); // Last 7 days
      
      for (const user of users) {
        const userId = user._id.toString();
        
        // Get user's sleep logs for the past week
        const sleepLogs = await this.sleepLogModel.find({
          userID: userId,
          startTime: { $gte: weekStart, $lt: now }
        }).exec();
        
        if (sleepLogs.length > 3) { // Only send insights if we have enough data
          // Calculate average sleep duration
          const totalDurationMinutes = sleepLogs.reduce((sum, log) => sum + log.duration, 0);
          const avgDurationHours = Math.round((totalDurationMinutes / sleepLogs.length) / 60 * 10) / 10;
          
          // Calculate average rating
          const totalRating = sleepLogs.reduce((sum, log) => sum + (log.rating || 0), 0);
          const avgRating = Math.round((totalRating / sleepLogs.length) * 10) / 10;
          
          // Create personalized message based on sleep quality
          let message = '';
          if (avgDurationHours < 6) {
            message = `You averaged only ${avgDurationHours} hours of sleep last week. Try to get more rest this week!`;
          } else if (avgDurationHours >= 6 && avgDurationHours < 7) {
            message = `You averaged ${avgDurationHours} hours of sleep last week. You're getting close to the recommended amount!`;
          } else {
            message = `Great job! You averaged ${avgDurationHours} hours of sleep last week, which meets health recommendations.`;
          }
          
          await this.notificationsService.create({
            userId,
            title: '📊 Your Weekly Sleep Insights',
            message,
            type: NotificationType.SLEEP_REMINDER,
            priority: NotificationPriority.LOW,
            actionLink: '/dashboard/sleep',
            metadata: {
              avgDuration: avgDurationHours,
              avgRating,
              logsCount: sleepLogs.length
            }
          });
          
          this.logger.log(`Sent sleep insights to user ${userId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error sending sleep insights: ${error.message}`);
    }
  }

  /**
   * Send notification about sleep quality
   */
  async sendSleepQualityNotification(
    userId: string, 
    rating: number, 
    durationHours: number, 
    isGoodSleep: boolean
  ): Promise<void> {
    try {
      let title = '';
      let message = '';
      let priority = NotificationPriority.LOW;
      
      if (isGoodSleep) {
        title = '🌙 Great Sleep!';
        message = `You slept for ${Math.round(durationHours * 10) / 10} hours with a rating of ${rating}/5. Keep up the good sleep habits!`;
      } else {
        title = '😴 Sleep Improvement Needed';
        priority = NotificationPriority.MEDIUM;
        
        if (durationHours < 6) {
          message = `You only slept for ${Math.round(durationHours * 10) / 10} hours. Try to get at least 7 hours for better health.`;
        } else {
          message = `Your sleep quality rating was ${rating}/5. Try to improve your sleep environment for better rest.`;
        }
      }
      
      await this.notificationsService.create({
        userId,
        title,
        message,
        type: NotificationType.SLEEP_REMINDER,
        priority,
        actionLink: '/dashboard/sleep',
        metadata: {
          rating,
          duration: durationHours,
          isGoodSleep,
          notificationType: 'sleep_quality'
        }
      });
      
      this.logger.log(`Sent sleep quality notification to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending sleep quality notification: ${error.message}`);
    }
  }
} 