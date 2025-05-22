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
import { WorkoutPlan } from '../../../infrastructure/database/schemas/workout-plan.schema';

@Injectable()
export class WorkoutNotificationService {
  private readonly logger = new Logger(WorkoutNotificationService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(WorkoutPlan.name) private workoutPlanModel: Model<WorkoutPlan>,
  ) {}

  /**
   * Send daily workout reminders to users
   * Runs at 8:00 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDailyWorkoutReminders() {
    this.logger.log('Running daily workout reminder job');
    
    try {
      // Get all active users with completed profiles
      const users = await this.userModel.find({
        isProfileCompleted: true
      }).exec();
      
      for (const user of users) {
        await this.sendWorkoutReminderToUser(user._id.toString());
      }
      
      this.logger.log(`Sent workout reminders to ${users.length} users`);
    } catch (error) {
      this.logger.error(`Error sending workout reminders: ${error.message}`);
    }
  }
  
  /**
   * Send workout reminder to a specific user
   */
  async sendWorkoutReminderToUser(userId: string) {
    try {
      // Check if user has active workout plan
      const workoutPlan = await this.workoutPlanModel.findOne({
        userId,
        isActive: true
      }).exec();
      
      if (!workoutPlan) {
        return; // Skip users without active workout plans
      }
      
      // Get current day of the week (0-6, where 0 is Sunday)
      const today = new Date().getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[today];
      
      // Check if today is a workout day for this user
      // Find a workout day that matches today
      const workoutForToday = workoutPlan.workoutDays?.find(day => 
        day.day?.toLowerCase() === dayName.toLowerCase()
      );
      
      if (!workoutForToday) {
        return; // No workout scheduled for today
      }
      
      // Create a personalized notification
      await this.notificationsService.create({
        userId,
        title: '🏋️‍♀️ Workout Reminder',
        message: `Don't forget your ${workoutForToday.focus || 'scheduled'} workout today!`,
        type: NotificationType.WORKOUT_REMINDER,
        priority: NotificationPriority.HIGH,
        actionLink: '/workouts/today',
        metadata: {
          workoutPlanId: workoutPlan._id.toString(),
          focus: workoutForToday.focus,
          dayOfWeek: dayName
        }
      });
      
      this.logger.log(`Sent workout reminder to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending workout reminder to user ${userId}: ${error.message}`);
    }
  }
  
  /**
   * Send workout goal achievement notifications
   */
  async sendWorkoutGoalAchievedNotification(
    userId: string, 
    achievementType: string, 
    details: Record<string, any>
  ) {
    try {
      await this.notificationsService.create({
        userId,
        title: '🎯 Goal Achieved!',
        message: `Congratulations! You've ${achievementType}`,
        type: NotificationType.GOAL_ACHIEVED,
        priority: NotificationPriority.HIGH,
        metadata: {
          achievementType,
          ...details
        }
      });
      
      this.logger.log(`Sent goal achievement notification to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending goal achievement notification: ${error.message}`);
    }
  }
} 