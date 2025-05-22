import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../infrastructure/database/schemas/user.schema';
import { UserActivity } from '../../infrastructure/database/schemas/userActivity.schema';
import { FoodLog } from '../../infrastructure/database/schemas/foodLog.schema';
import { SleepLog } from '../../infrastructure/database/schemas/sleepLog.schema';
import { WorkoutPlan } from '../../infrastructure/database/schemas/workout-plan.schema';
import { FitnessProfile } from '../../infrastructure/database/schemas/fitness-profile.schema';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, format } from 'date-fns';

interface ActivityTypeData {
  count: number;
  totalDuration: number;
  totalCalories: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserActivity.name) private userActivityModel: Model<UserActivity>,
    @InjectModel(FoodLog.name) private foodLogModel: Model<FoodLog>,
    @InjectModel(SleepLog.name) private sleepLogModel: Model<SleepLog>,
    @InjectModel(WorkoutPlan.name) private workoutPlanModel: Model<WorkoutPlan>,
    @InjectModel(FitnessProfile.name) private fitnessProfileModel: Model<FitnessProfile>,
  ) {}

  async getUserStats(userId: string) {
    const [
      totalWorkouts,
      totalSleepLogs,
      totalFoodLogs,
      weeklyWorkouts,
      weeklySleepLogs,
      weeklyFoodLogs
    ] = await Promise.all([
      this.userActivityModel.countDocuments({ user: userId }),
      this.sleepLogModel.countDocuments({ userID: userId }),
      this.foodLogModel.countDocuments({ userId }),
      this.userActivityModel.countDocuments({ 
        user: userId,
        createdAt: { $gte: startOfWeek(new Date()), $lte: endOfWeek(new Date()) }
      }),
      this.sleepLogModel.countDocuments({ 
        userID: userId,
        startTime: { $gte: startOfWeek(new Date()), $lte: endOfWeek(new Date()) }
      }),
      this.foodLogModel.countDocuments({ 
        userId,
        date: { $gte: startOfWeek(new Date()), $lte: endOfWeek(new Date()) }
      })
    ]);
    
    return {
      totalWorkouts,
      totalSleepLogs,
      totalFoodLogs,
      weeklyWorkouts,
      weeklySleepLogs,
      weeklyFoodLogs,
      completionRate: {
        workouts: weeklyWorkouts >= 3 ? 100 : Math.round((weeklyWorkouts / 3) * 100),
        sleepLogs: weeklySleepLogs >= 7 ? 100 : Math.round((weeklySleepLogs / 7) * 100),
        foodLogs: weeklyFoodLogs >= 21 ? 100 : Math.round((weeklyFoodLogs / 21) * 100)
      }
    };
  }

  async getUserProfile(userId: string) {
    const [user, fitnessProfile] = await Promise.all([
      this.userModel.findById(userId).select('-password -currentOtp'),
      this.fitnessProfileModel.findOne({ userId })
    ]);
    
    if (!user) {
      return null;
    }
    
    return {
      name: `${user.firstName} ${user.lastName}`,
      height: user.height,
      weight: user.weight,
      targetWeight: fitnessProfile?.targetWeight,
      fitnessLevel: fitnessProfile?.fitnessLevel || 'beginner',
      fitnessGoals: fitnessProfile?.fitnessGoals || [],
      activityLevel: user.activityLevel
    };
  }

  async getActivitySummary(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
    const now = new Date();
    let startDate, endDate;
    let previousStartDate, previousEndDate;

    switch(period) {
      case 'daily':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        previousStartDate = startOfDay(subDays(now, 1));
        previousEndDate = endOfDay(subDays(now, 1));
        break;
      case 'weekly':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        previousStartDate = startOfWeek(subWeeks(now, 1));
        previousEndDate = endOfWeek(subWeeks(now, 1));
        break;
      case 'monthly':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
        break;
    }

    const [currentActivities, previousActivities] = await Promise.all([
      this.userActivityModel.find({
        user: userId,
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      this.userActivityModel.find({
        user: userId,
        createdAt: { $gte: previousStartDate, $lte: previousEndDate }
      })
    ]);

    // Calculate current period metrics
    const totalWorkoutTime = currentActivities.reduce((total, activity) => total + activity.duration, 0);
    const totalCaloriesBurned = Math.round(currentActivities.reduce((total, activity) => total + (activity.caloriesBurned || 0), 0));
    const activityCount = currentActivities.length;
    
    // Calculate previous period metrics for comparison
    const previousTotalWorkoutTime = previousActivities.reduce((total, activity) => total + activity.duration, 0);
    const previousTotalCaloriesBurned = Math.round(previousActivities.reduce((total, activity) => total + (activity.caloriesBurned || 0), 0));
    const previousActivityCount = previousActivities.length;
    
    // Calculate percentage changes
    const workoutTimeChange = previousTotalWorkoutTime === 0 
      ? 100 
      : Math.round(((totalWorkoutTime - previousTotalWorkoutTime) / previousTotalWorkoutTime) * 100);
    
    const caloriesBurnedChange = previousTotalCaloriesBurned === 0 
      ? 100 
      : Math.round(((totalCaloriesBurned - previousTotalCaloriesBurned) / previousTotalCaloriesBurned) * 100);
    
    const activityCountChange = previousActivityCount === 0 
      ? 100 
      : Math.round(((activityCount - previousActivityCount) / previousActivityCount) * 100);

    // Get top activity types
    const activityTypes: Record<string, ActivityTypeData> = {};
    currentActivities.forEach(activity => {
      const title = activity.title;
      if (!activityTypes[title]) {
        activityTypes[title] = {
          count: 0,
          totalDuration: 0,
          totalCalories: 0,
        };
      }
      activityTypes[title].count += 1;
      activityTypes[title].totalDuration += activity.duration;
      activityTypes[title].totalCalories += activity.caloriesBurned || 0;
    });

    // Get top 3 activities by duration
    const topActivities = Object.entries(activityTypes)
      .map(([title, data]) => ({ 
        title, 
        duration: data.totalDuration, 
        calories: data.totalCalories, 
        count: data.count 
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3);

    return {
      period,
      periodLabel: this.getPeriodLabel(period),
      stats: {
        workoutTime: {
          total: totalWorkoutTime,
          unit: 'minutes',
          change: workoutTimeChange
        },
        caloriesBurned: {
          total: totalCaloriesBurned,
          unit: 'kcal',
          change: caloriesBurnedChange
        },
        activityCount: {
          total: activityCount,
          change: activityCountChange
        }
      },
      topActivities
    };
  }

  async getNutritionSummary(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
    const now = new Date();
    let startDate, endDate;
    let previousStartDate, previousEndDate;

    switch(period) {
      case 'daily':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        previousStartDate = startOfDay(subDays(now, 1));
        previousEndDate = endOfDay(subDays(now, 1));
        break;
      case 'weekly':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        previousStartDate = startOfWeek(subWeeks(now, 1));
        previousEndDate = endOfWeek(subWeeks(now, 1));
        break;
      case 'monthly':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
        break;
    }

    const [currentFoodLogs, previousFoodLogs] = await Promise.all([
      this.foodLogModel.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }),
      this.foodLogModel.find({
        userId,
        date: { $gte: previousStartDate, $lte: previousEndDate }
      })
    ]);

    // Calculate current period totals
    const totalCalories = currentFoodLogs.reduce((total, log) => total + log.calories, 0);
    const totalProtein = currentFoodLogs.reduce((total, log) => total + log.protein, 0);
    const totalCarbs = currentFoodLogs.reduce((total, log) => total + log.carbs, 0);
    const totalFats = currentFoodLogs.reduce((total, log) => total + log.fats, 0);

    // Calculate previous period totals
    const previousTotalCalories = previousFoodLogs.reduce((total, log) => total + log.calories, 0);
    const previousTotalProtein = previousFoodLogs.reduce((total, log) => total + log.protein, 0);
    const previousTotalCarbs = previousFoodLogs.reduce((total, log) => total + log.carbs, 0);
    const previousTotalFats = previousFoodLogs.reduce((total, log) => total + log.fats, 0);

    // Calculate percentage changes
    const caloriesChange = previousTotalCalories === 0 
      ? 100 
      : Math.round(((totalCalories - previousTotalCalories) / previousTotalCalories) * 100);
    
    const proteinChange = previousTotalProtein === 0 
      ? 100 
      : Math.round(((totalProtein - previousTotalProtein) / previousTotalProtein) * 100);
    
    const carbsChange = previousTotalCarbs === 0 
      ? 100 
      : Math.round(((totalCarbs - previousTotalCarbs) / previousTotalCarbs) * 100);
    
    const fatsChange = previousTotalFats === 0 
      ? 100 
      : Math.round(((totalFats - previousTotalFats) / previousTotalFats) * 100);

    // Calculate daily averages
    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgCaloriesPerDay = Math.round(totalCalories / days);
    const avgProteinPerDay = Math.round(totalProtein / days);
    const avgCarbsPerDay = Math.round(totalCarbs / days);
    const avgFatsPerDay = Math.round(totalFats / days);

    // Calculate macronutrient distribution
    const totalMacros = totalProtein + totalCarbs + totalFats;
    const proteinPercentage = totalMacros === 0 ? 0 : Math.round((totalProtein / totalMacros) * 100);
    const carbsPercentage = totalMacros === 0 ? 0 : Math.round((totalCarbs / totalMacros) * 100);
    const fatsPercentage = totalMacros === 0 ? 0 : Math.round((totalFats / totalMacros) * 100);

    return {
      period,
      periodLabel: this.getPeriodLabel(period),
      stats: {
        calories: {
          total: totalCalories,
          average: avgCaloriesPerDay,
          unit: 'kcal',
          change: caloriesChange
        },
        protein: {
          total: totalProtein,
          average: avgProteinPerDay,
          unit: 'g',
          change: proteinChange,
          percentage: proteinPercentage
        },
        carbs: {
          total: totalCarbs,
          average: avgCarbsPerDay,
          unit: 'g',
          change: carbsChange,
          percentage: carbsPercentage
        },
        fats: {
          total: totalFats,
          average: avgFatsPerDay,
          unit: 'g',
          change: fatsChange,
          percentage: fatsPercentage
        }
      },
      macroDistribution: {
        protein: proteinPercentage,
        carbs: carbsPercentage,
        fats: fatsPercentage
      }
    };
  }

  async getSleepSummary(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly') {
    const now = new Date();
    let startDate, endDate;
    let previousStartDate, previousEndDate;

    switch(period) {
      case 'daily':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        previousStartDate = startOfDay(subDays(now, 1));
        previousEndDate = endOfDay(subDays(now, 1));
        break;
      case 'weekly':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        previousStartDate = startOfWeek(subWeeks(now, 1));
        previousEndDate = endOfWeek(subWeeks(now, 1));
        break;
      case 'monthly':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        previousStartDate = startOfMonth(subMonths(now, 1));
        previousEndDate = endOfMonth(subMonths(now, 1));
        break;
    }

    const [currentSleepLogs, previousSleepLogs] = await Promise.all([
      this.sleepLogModel.find({
        userID: userId,
        startTime: { $gte: startDate, $lte: endDate }
      }),
      this.sleepLogModel.find({
        userID: userId,
        startTime: { $gte: previousStartDate, $lte: previousEndDate }
      })
    ]);

    // Current period calculations
    const totalSleepDuration = currentSleepLogs.reduce((total, log) => total + log.duration, 0);
    const avgSleepDuration = currentSleepLogs.length > 0 ? 
      Math.round(totalSleepDuration / currentSleepLogs.length) : 0;
    const avgSleepRating = currentSleepLogs.length > 0 ? 
      Math.round(currentSleepLogs.reduce((sum, log) => sum + log.rating, 0) / currentSleepLogs.length * 10) / 10 : 0;

    // Previous period calculations
    const previousTotalSleepDuration = previousSleepLogs.reduce((total, log) => total + log.duration, 0);
    const previousAvgSleepDuration = previousSleepLogs.length > 0 ? 
      Math.round(previousTotalSleepDuration / previousSleepLogs.length) : 0;
    const previousAvgSleepRating = previousSleepLogs.length > 0 ? 
      Math.round(previousSleepLogs.reduce((sum, log) => sum + log.rating, 0) / previousSleepLogs.length * 10) / 10 : 0;

    // Calculate percentage changes
    const durationChange = previousAvgSleepDuration === 0 ? 
      100 : Math.round(((avgSleepDuration - previousAvgSleepDuration) / previousAvgSleepDuration) * 100);
    const ratingChange = previousAvgSleepRating === 0 ? 
      100 : Math.round(((avgSleepRating - previousAvgSleepRating) / previousAvgSleepRating) * 100);

    return {
      period,
      periodLabel: this.getPeriodLabel(period),
      stats: {
        avgDuration: {
          value: avgSleepDuration,
          unit: 'hours',
          change: durationChange
        },
        avgRating: {
          value: avgSleepRating,
          scale: '5',
          change: ratingChange
        },
        consistency: {
          value: Math.min(100, Math.round((currentSleepLogs.length / 7) * 100)),
          unit: '%'
        }
      },
      qualityDistribution: {
        excellent: currentSleepLogs.filter(log => log.rating === 5).length,
        good: currentSleepLogs.filter(log => log.rating === 4).length,
        average: currentSleepLogs.filter(log => log.rating === 3).length,
        poor: currentSleepLogs.filter(log => log.rating === 2).length,
        veryPoor: currentSleepLogs.filter(log => log.rating === 1).length
      }
    };
  }

  async getProgressTracking(userId: string) {
    // Get user profile data
    const [fitnessProfile, user] = await Promise.all([
      this.fitnessProfileModel.findOne({ userId }),
      this.userModel.findById(userId)
    ]);
    
    if (!user) {
      return null;
    }
    
    // Get weight data
    const currentWeight = user.weight || 0;
    const targetWeight = fitnessProfile?.targetWeight || currentWeight;
    const startingWeight = currentWeight; // Ideally would track this historically
    
    // Calculate weight metrics
    const weightDifference = Math.round((currentWeight - targetWeight) * 10) / 10;
    const progressPercentage = targetWeight === currentWeight ? 
      100 : Math.round(Math.min(100, Math.max(0, (1 - Math.abs(weightDifference) / Math.abs(startingWeight - targetWeight)) * 100)));
    
    // Goal status
    const goalStatus = weightDifference === 0 ? 'achieved' : 
                     (user.goal === 'lose' && weightDifference > 0) || 
                     (user.goal === 'gain' && weightDifference < 0) ? 
                     'in progress' : 'achieved';
    
    // Activity stats
    const last30DaysActivities = await this.userActivityModel.countDocuments({
      user: userId,
      createdAt: { $gte: subDays(new Date(), 30) }
    });
    
    return {
      weight: {
        current: currentWeight,
        target: targetWeight,
        difference: weightDifference,
        unit: 'kg'
      },
      goal: {
        type: user.goal || 'maintain',
        status: goalStatus,
        progressPercentage
      },
      fitness: {
        level: fitnessProfile?.fitnessLevel || 'beginner',
        activityLastMonth: last30DaysActivities,
        consistencyScore: Math.min(100, Math.round((last30DaysActivities / 20) * 100))
      }
    };
  }

  async getDashboardOverview(userId: string) {
    const [userStats, profile, activitySummary, nutritionSummary, sleepSummary, progressTracking] = await Promise.all([
      this.getUserStats(userId),
      this.getUserProfile(userId),
      this.getActivitySummary(userId),
      this.getNutritionSummary(userId),
      this.getSleepSummary(userId),
      this.getProgressTracking(userId),
    ]);

    return {
      profile,
      userStats,
      activitySummary,
      nutritionSummary,
      sleepSummary,
      progressTracking,
    };
  }

  private getPeriodLabel(period: 'daily' | 'weekly' | 'monthly'): string {
    const now = new Date();
    
    switch(period) {
      case 'daily':
        return format(now, 'MMMM d, yyyy');
      case 'weekly':
        return `${format(startOfWeek(now), 'MMM d')} - ${format(endOfWeek(now), 'MMM d, yyyy')}`;
      case 'monthly':
        return format(now, 'MMMM yyyy');
      default:
        return '';
    }
  }
} 