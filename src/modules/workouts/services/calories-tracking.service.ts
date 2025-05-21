import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserCaloriesBurned, UserCaloriesBurnedDocument } from '../../../infrastructure/database/schemas/userCaloriesBurned.schema';
import { WorkoutPlan } from '../interfaces/workout-plan.interface';
import { startOfDay, startOfWeek, startOfMonth, compareAsc } from 'date-fns';

@Injectable()
export class CaloriesTrackingService {
  private readonly logger = new Logger(CaloriesTrackingService.name);

  constructor(
    @InjectModel(UserCaloriesBurned.name)
    private userCaloriesBurnedModel: Model<UserCaloriesBurnedDocument>,
  ) {}

  /**
   * Get or create a user's calorie tracking document for the current day
   */
  private async getOrCreateUserCaloriesForToday(userId: string): Promise<UserCaloriesBurnedDocument> {
    const today = startOfDay(new Date());
    
    let userCalories = await this.userCaloriesBurnedModel.findOne({
      userId,
      date: { $gte: today }
    });
    
    if (!userCalories) {
      userCalories = new this.userCaloriesBurnedModel({
        userId,
        date: today,
        dailyCaloriesBurned: 0,
        weeklyCaloriesBurned: 0,
        monthlyCaloriesBurned: 0,
        totalCaloriesBurned: 0,
        workoutSessions: []
      });
      
      // Get the latest record for this user to initialize total calories
      const latestRecord = await this.userCaloriesBurnedModel
        .findOne({ userId })
        .sort({ date: -1 });
        
      if (latestRecord) {
        userCalories.totalCaloriesBurned = latestRecord.totalCaloriesBurned;
      }
    }
    
    return userCalories;
  }
  
  /**
   * Update user's calories burned when a workout is completed
   */
  async updateCaloriesBurned(
    userId: string, 
    workoutPlan: WorkoutPlan, 
    dayIndex: number, 
    caloriesBurned: number
  ): Promise<void> {
    try {
      if (caloriesBurned <= 0) {
        return;
      }
      
      const userCalories = await this.getOrCreateUserCaloriesForToday(userId);
      const today = new Date();
      const weekStart = startOfWeek(today);
      const monthStart = startOfMonth(today);
      
      // Update daily calories burned
      userCalories.dailyCaloriesBurned += caloriesBurned;
      
      // Update weekly calories burned
      userCalories.weeklyCaloriesBurned += caloriesBurned;
      
      // Update monthly calories burned
      userCalories.monthlyCaloriesBurned += caloriesBurned;
      
      // Update total calories burned
      userCalories.totalCaloriesBurned += caloriesBurned;
      
      // Add to workout sessions
      userCalories.workoutSessions.push({
        workoutId: workoutPlan._id.toString(),
        workoutDay: workoutPlan.workoutDays[dayIndex].day,
        caloriesBurned,
        date: today
      });
      
      await userCalories.save()
      
      this.logger.debug(`Updated calories burned for user ${userId}: +${caloriesBurned}, total: ${userCalories.totalCaloriesBurned}`);
    } catch (error) {
      this.logger.error(`Error updating calories burned: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Get user's calories burned statistics
   */
  async getUserCaloriesStats(userId: string): Promise<{
    dailyCaloriesBurned: number;
    weeklyCaloriesBurned: number;
    monthlyCaloriesBurned: number;
    totalCaloriesBurned: number;
  }> {
    try {
      const userCalories = await this.getOrCreateUserCaloriesForToday(userId);
      
      return {
        dailyCaloriesBurned: userCalories.dailyCaloriesBurned,
        weeklyCaloriesBurned: userCalories.weeklyCaloriesBurned,
        monthlyCaloriesBurned: userCalories.monthlyCaloriesBurned,
        totalCaloriesBurned: userCalories.totalCaloriesBurned
      };
    } catch (error) {
      this.logger.error(`Error getting calories stats: ${error.message}`, error.stack);
      return {
        dailyCaloriesBurned: 0,
        weeklyCaloriesBurned: 0,
        monthlyCaloriesBurned: 0,
        totalCaloriesBurned: 0
      };
    }
  }
  
  /**
   * Get user's workout session history
   */
  async getUserWorkoutSessions(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const userCalories = await this.userCaloriesBurnedModel
        .find({ userId })
        .sort({ date: -1 })
        .limit(10);
      
      let sessions = [];
      userCalories.forEach(record => {
        sessions = [...sessions, ...record.workoutSessions];
      });
      
      // Sort by date and limit
      return sessions
        .sort((a, b) => compareAsc(new Date(b.date), new Date(a.date)))
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`Error getting workout sessions: ${error.message}`, error.stack);
      return [];
    }
  }
} 