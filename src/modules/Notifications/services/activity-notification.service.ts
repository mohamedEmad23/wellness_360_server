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
import { UserActivity } from '../../../infrastructure/database/schemas/userActivity.schema';

@Injectable()
export class ActivityNotificationService {
  private readonly logger = new Logger(ActivityNotificationService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserActivity.name) private userActivityModel: Model<UserActivity>,
  ) {}

  /**
   * Send activity reminders to users who haven't logged activity today
   * Runs at 2:00 PM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_2PM)
  async sendActivityReminders() {
    this.logger.log('Running activity reminder job');
    
    try {
      // Get all active users with completed profiles
      const users = await this.userModel.find({
        isProfileCompleted: true
      }).exec();
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      for (const user of users) {
        const userId = user._id.toString();
        
        // Check if user has logged any activity today
        const todayActivity = await this.userActivityModel.findOne({
          user: userId,
          createdAt: { $gte: today }
        }).exec();
        
        if (!todayActivity) {
          // Get a random activity suggestion
          const activitySuggestions = [
            "Take a 10-minute walk during your lunch break.",
            "Try some quick desk stretches to boost your energy.",
            "Take the stairs instead of the elevator today.",
            "Stand up and move around for 5 minutes every hour.",
            "Do a quick set of jumping jacks to get your heart rate up."
          ];
          
          const randomSuggestion = activitySuggestions[
            Math.floor(Math.random() * activitySuggestions.length)
          ];
          
          // Send activity reminder
          await this.notificationsService.create({
            userId,
            title: '🏃‍♂️ Activity Reminder',
            message: `You haven't logged any activity today. ${randomSuggestion}`,
            type: NotificationType.ACTIVITY_REMINDER,
            priority: NotificationPriority.MEDIUM,
            actionLink: '/activity/log',
            metadata: {
              suggestion: randomSuggestion
            }
          });
          
          this.logger.log(`Sent activity reminder to user ${userId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error sending activity reminders: ${error.message}`);
    }
  }
  
  /**
   * Send weekly activity summary
   * Runs every Sunday at 6:00 PM
   */
  @Cron('0 18 * * 0')
  async sendWeeklyActivitySummary() {
    this.logger.log('Running weekly activity summary job');
    
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
        
        // Get user's activities for the past week
        const weekActivities = await this.userActivityModel.find({
          user: userId,
          createdAt: { $gte: weekStart, $lt: now }
        }).exec();
        
        if (weekActivities.length > 0) {
          // Calculate total active minutes
          const totalActiveMinutes = weekActivities.reduce(
            (sum, activity) => sum + (activity.duration || 0), 0
          );
          
          // Calculate active days
          const activeDays = new Set(
            weekActivities.map(a => new Date(a.createdAt).toDateString())
          ).size;
          
          // Create personalized message
          let message = '';
          if (activeDays >= 5) {
            message = `Great job! You were active ${activeDays} days this week for a total of ${totalActiveMinutes} minutes.`;
          } else if (activeDays >= 3) {
            message = `Good progress! You were active ${activeDays} days this week for ${totalActiveMinutes} minutes. Try for one more day next week!`;
          } else {
            message = `You were active ${activeDays} days this week for ${totalActiveMinutes} minutes. Aim for at least 3 active days next week!`;
          }
          
          await this.notificationsService.create({
            userId,
            title: '📊 Your Weekly Activity Summary',
            message,
            type: NotificationType.ACTIVITY_REMINDER,
            priority: NotificationPriority.LOW,
            actionLink: '/dashboard/activity',
            metadata: {
              activeDays,
              totalMinutes: totalActiveMinutes,
              activitiesCount: weekActivities.length
            }
          });
          
          this.logger.log(`Sent activity summary to user ${userId}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error sending activity summaries: ${error.message}`);
    }
  }

  /**
   * Send achievement notification when user completes a significant activity
   */
  async sendActivityAchievementNotification(
    userId: string,
    achievementMessage: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await this.notificationsService.create({
        userId,
        title: '🏆 Activity Achievement',
        message: `Great job! You've ${achievementMessage}`,
        type: NotificationType.ACTIVITY_REMINDER,
        priority: NotificationPriority.MEDIUM,
        actionLink: '/dashboard/activity',
        metadata: {
          ...details,
          achievementType: 'activity',
          notificationType: 'activity_achievement'
        }
      });
      
      this.logger.log(`Sent activity achievement notification to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending activity achievement notification: ${error.message}`);
    }
  }
} 