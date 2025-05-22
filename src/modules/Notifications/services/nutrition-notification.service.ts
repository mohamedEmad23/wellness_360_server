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
import { FoodLog } from '../../../infrastructure/database/schemas/foodLog.schema';
import { UserMacros } from '../../../infrastructure/database/schemas/userMacros.schema';

@Injectable()
export class NutritionNotificationService {
  private readonly logger = new Logger(NutritionNotificationService.name);
  // Track users who have already received a calorie limit notification today
  private notifiedUsers: Set<string> = new Set();

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(FoodLog.name) private foodLogModel: Model<FoodLog>,
    @InjectModel(UserMacros.name) private userMacrosModel: Model<UserMacros>,
  ) {
    // Reset the notified users set at midnight
    this.resetNotifiedUsers();
  }

  /**
   * Reset the notified users set at midnight
   */
  @Cron('0 0 * * *')
  private resetNotifiedUsers() {
    this.notifiedUsers.clear();
    this.logger.log('Reset notified users tracking for calorie limit notifications');
  }

  /**
   * Check for calorie limit exceedance every hour between 7 AM and 10 PM
   */
  @Cron('0 7-22 * * *')
  async checkCalorieLimitExceedance() {
    this.logger.log('Running calorie limit check');
    
    try {
      // Get all active users with completed profiles
      const users = await this.userModel.find({
        isProfileCompleted: true
      }).exec();
      
      for (const user of users) {
        const userId = user._id.toString();
        
        // Skip users who have already been notified today
        if (this.notifiedUsers.has(userId)) {
          continue;
        }
        
        await this.checkUserCalorieLimit(userId);
      }
    } catch (error) {
      this.logger.error(`Error checking calorie limits: ${error.message}`);
    }
  }

  /**
   * Check if a specific user has exceeded their calorie limit
   */
  async checkUserCalorieLimit(userId: string) {
    try {
      // Get user's macros
      const userMacros = await this.userMacrosModel.findOne({ userId }).exec();
      
      if (!userMacros) {
        return; // User doesn't have macros set up
      }
      
      // Check if the user has exceeded their daily calorie limit
      if (userMacros.caloriesLeft <= 0) {
        // Send notification
        await this.sendCalorieLimitExceededNotification(
          userId, 
          userMacros.dailyCalories
        );
        
        // Mark user as notified for today
        this.notifiedUsers.add(userId);
      }
      
      // Check if user is close to their limit (within 10%)
      const warningThreshold = userMacros.dailyCalories * 0.1;
      if (!this.notifiedUsers.has(userId) && 
          userMacros.caloriesLeft > 0 && 
          userMacros.caloriesLeft <= warningThreshold) {
        await this.sendCalorieWarningNotification(
          userId, 
          userMacros.caloriesLeft
        );
      }
    } catch (error) {
      this.logger.error(`Error checking calorie limit for user ${userId}: ${error.message}`);
    }
  }

  /**
   * Send notification when user exceeds daily calorie limit
   */
  async sendCalorieLimitExceededNotification(userId: string, dailyLimit: number) {
    try {
      await this.notificationsService.create({
        userId,
        title: '🍽️ Daily Calorie Limit Exceeded',
        message: `You've exceeded your daily calorie limit of ${dailyLimit}. Consider lighter options for your remaining meals today.`,
        type: NotificationType.CUSTOM,
        priority: NotificationPriority.HIGH,
        actionLink: '/dashboard/nutrition',
        metadata: {
          calorieLimit: dailyLimit,
          exceeded: true,
          notificationType: 'calorie_limit_exceeded'
        }
      });
      
      this.logger.log(`Sent calorie limit exceeded notification to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending calorie limit notification: ${error.message}`);
    }
  }

  /**
   * Send warning notification when user is approaching their daily calorie limit
   */
  async sendCalorieWarningNotification(userId: string, caloriesLeft: number) {
    try {
      await this.notificationsService.create({
        userId,
        title: '🍽️ Approaching Calorie Limit',
        message: `You have only ${Math.round(caloriesLeft)} calories left for today. Plan your remaining meals carefully!`,
        type: NotificationType.CUSTOM,
        priority: NotificationPriority.MEDIUM,
        actionLink: '/dashboard/nutrition',
        metadata: {
          caloriesLeft,
          warning: true,
          notificationType: 'calorie_limit_warning'
        }
      });
      
      this.logger.log(`Sent calorie limit warning notification to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending calorie warning notification: ${error.message}`);
    }
  }

  /**
   * Send a notification when a meal is logged that is particularly high in calories
   * This can be called from the FoodLogService
   */
  async notifyHighCalorieMeal(userId: string, mealName: string, calories: number) {
    if (calories < 600) return; // Only notify for high-calorie meals
    
    try {
      await this.notificationsService.create({
        userId,
        title: '🍔 High Calorie Meal Detected',
        message: `Your meal "${mealName}" contains ${calories} calories, which is quite high. Consider balancing this with lighter meals for the rest of the day.`,
        type: NotificationType.CUSTOM,
        priority: NotificationPriority.MEDIUM,
        actionLink: '/dashboard/nutrition',
        metadata: {
          mealName,
          calories,
          notificationType: 'high_calorie_meal'
        }
      });
      
      this.logger.log(`Sent high calorie meal notification to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending high calorie meal notification: ${error.message}`);
    }
  }

  /**
   * Send daily nutrition summary in the evening
   */
  @Cron('0 20 * * *') // Every day at 8 PM
  async sendDailyNutritionSummary() {
    this.logger.log('Running daily nutrition summary job');
    
    try {
      // Get all active users with completed profiles
      const users = await this.userModel.find({
        isProfileCompleted: true
      }).exec();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const user of users) {
        const userId = user._id.toString();
        
        // Get user's macros for today
        const userMacros = await this.userMacrosModel.findOne({ userId }).exec();
        
        if (!userMacros) {
          continue; // Skip if no macros
        }
        
        // Get user's food logs for today
        const foodLogs = await this.foodLogModel.find({
          userId,
          date: { $gte: today }
        }).exec();
        
        // Calculate total nutrition from food logs
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFats = 0;
        
        foodLogs.forEach(log => {
          totalCalories += log.calories;
          totalProtein += log.protein;
          totalCarbs += log.carbs;
          totalFats += log.fats;
        });
        
        // Create message based on nutritional status
        let message = '';
        let title = '📊 Daily Nutrition Summary';
        
        if (totalCalories > userMacros.dailyCalories) {
          message = `Today you consumed ${Math.round(totalCalories)} calories, which is ${Math.round(totalCalories - userMacros.dailyCalories)} above your limit. Try to balance this tomorrow!`;
        } else if (totalCalories < userMacros.dailyCalories * 0.5) {
          message = `Today you only consumed ${Math.round(totalCalories)} calories, which is quite low. Make sure you're getting enough nutrition!`;
        } else {
          message = `Today you consumed ${Math.round(totalCalories)} calories (${Math.round((totalCalories / userMacros.dailyCalories) * 100)}% of your daily target).`;
        }
        
        await this.notificationsService.create({
          userId,
          title,
          message,
          type: NotificationType.CUSTOM,
          priority: NotificationPriority.LOW,
          actionLink: '/dashboard/nutrition',
          metadata: {
            calories: Math.round(totalCalories),
            protein: Math.round(totalProtein),
            carbs: Math.round(totalCarbs),
            fats: Math.round(totalFats),
            notificationType: 'nutrition_summary'
          }
        });
        
        this.logger.log(`Sent daily nutrition summary to user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Error sending nutrition summaries: ${error.message}`);
    }
  }
} 