import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../infrastructure/database/schemas/user.schema';
import { UserActivity } from '../../infrastructure/database/schemas/userActivity.schema';
import { FoodLog } from '../../infrastructure/database/schemas/foodLog.schema';
import { SleepLog } from '../../infrastructure/database/schemas/sleepLog.schema';
import { WorkoutPlan } from '../../infrastructure/database/schemas/workout-plan.schema';
import { FitnessProfile } from '../../infrastructure/database/schemas/fitness-profile.schema';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subDays, 
  subWeeks, 
  subMonths, 
  format, 
  parseISO,
  isValid 
} from 'date-fns';

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

  /**
   * Get date range for a period
   * @param period Period type (daily, weekly, monthly)
   * @param date Optional specific date, defaults to current date
   * @returns Object with startDate, endDate, previousStartDate, previousEndDate
   */
  private getDateRangeForPeriod(period: 'daily' | 'weekly' | 'monthly', date?: string | Date): {
    startDate: Date;
    endDate: Date;
    previousStartDate: Date;
    previousEndDate: Date;
  } {
    // Parse the date if provided, otherwise use current date
    let baseDate: Date;
    
    if (date) {
      if (typeof date === 'string') {
        try {
          // Try parsing as ISO string
          baseDate = new Date(date);
          
          // Check if valid date
          if (isNaN(baseDate.getTime())) {
            console.warn('Invalid date provided:', date);
            baseDate = new Date(); // Fallback to current date
          }
        } catch (error) {
          console.warn('Error parsing date:', error);
          baseDate = new Date(); // Fallback to current date
        }
      } else {
        baseDate = date;
      }
    } else {
      baseDate = new Date();
    }

    // Ensure baseDate is valid before proceeding
    if (isNaN(baseDate.getTime())) {
      console.warn('Invalid base date after processing, using current date');
      baseDate = new Date();
    }

    let startDate: Date, endDate: Date;
    let previousStartDate: Date, previousEndDate: Date;

    try {
      switch(period) {
        case 'daily':
          // Current day: from start of day to end of day
          startDate = startOfDay(baseDate);
          endDate = endOfDay(baseDate);
          
          // Previous day: from start of previous day to end of previous day
          previousStartDate = startOfDay(subDays(baseDate, 1));
          previousEndDate = endOfDay(subDays(baseDate, 1));
          break;

        case 'weekly':
          // Current week: from start of week to end of week 
          startDate = startOfWeek(baseDate, { weekStartsOn: 1 }); // Start on Monday
          endDate = endOfWeek(baseDate, { weekStartsOn: 1 }); // End on Sunday
          
          // Previous week
          previousStartDate = startOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 1 });
          previousEndDate = endOfWeek(subWeeks(baseDate, 1), { weekStartsOn: 1 });
          break;

        case 'monthly':
        default:
          // Current month: from start of month to end of month
          startDate = startOfMonth(baseDate);
          endDate = endOfMonth(baseDate);
          
          // Previous month
          previousStartDate = startOfMonth(subMonths(baseDate, 1));
          previousEndDate = endOfMonth(subMonths(baseDate, 1));
          break;
      }

      // Additional validation to ensure all dates are valid
      if (isNaN(startDate.getTime())) {
        console.warn('Invalid startDate generated, using fallback');
        startDate = startOfDay(new Date());
      }
      if (isNaN(endDate.getTime())) {
        console.warn('Invalid endDate generated, using fallback');
        endDate = endOfDay(new Date());
      }
      if (isNaN(previousStartDate.getTime())) {
        console.warn('Invalid previousStartDate generated, using fallback');
        previousStartDate = startOfDay(subDays(new Date(), 1));
      }
      if (isNaN(previousEndDate.getTime())) {
        console.warn('Invalid previousEndDate generated, using fallback');
        previousEndDate = endOfDay(subDays(new Date(), 1));
      }
    } catch (error) {
      console.error('Error processing date range:', error);
      // Fallback to current date range if there's an error
      startDate = startOfDay(new Date());
      endDate = endOfDay(new Date());
      previousStartDate = startOfDay(subDays(new Date(), 1));
      previousEndDate = endOfDay(subDays(new Date(), 1));
    }

    return {
      startDate,
      endDate,
      previousStartDate,
      previousEndDate
    };
  }

  async getUserStats(userId: string) {
    const now = new Date();
    const weekDateRange = this.getDateRangeForPeriod('weekly', now);
    
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
        createdAt: { $gte: weekDateRange.startDate, $lte: weekDateRange.endDate }
      }),
      this.sleepLogModel.countDocuments({ 
        userID: userId,
        startTime: { $gte: weekDateRange.startDate, $lte: weekDateRange.endDate }
      }),
      this.foodLogModel.countDocuments({ 
        userId,
        date: { $gte: weekDateRange.startDate, $lte: weekDateRange.endDate }
      })
    ]);
    
    // Target recommendations based on fitness best practices
    const targetWeeklyWorkouts = 3; // Minimum recommended workouts per week
    const targetDailySleepLogs = 1; // One sleep log per day
    const targetDailyFoodLogs = 3; // Three meals per day
    
    // Calculate days in current period
    const daysInPeriod = Math.ceil((weekDateRange.endDate.getTime() - weekDateRange.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      totalWorkouts,
      totalSleepLogs,
      totalFoodLogs,
      weeklyWorkouts,
      weeklySleepLogs,
      weeklyFoodLogs,
      completionRate: {
        workouts: Math.min(100, Math.round((weeklyWorkouts / targetWeeklyWorkouts) * 100)),
        sleepLogs: Math.min(100, Math.round((weeklySleepLogs / daysInPeriod) * 100)),
        foodLogs: Math.min(100, Math.round((weeklyFoodLogs / (targetDailyFoodLogs * daysInPeriod)) * 100))
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

  async getActivitySummary(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly', date?: string) {
    const dateRange = this.getDateRangeForPeriod(period, date);
    
    const [currentActivities, previousActivities] = await Promise.all([
      this.userActivityModel.find({
        user: userId,
        createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate }
      }),
      this.userActivityModel.find({
        user: userId,
        createdAt: { $gte: dateRange.previousStartDate, $lte: dateRange.previousEndDate }
      })
    ]);

    // Calculate days in period for proper averaging
    const daysInCurrentPeriod = Math.max(1, Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysInPreviousPeriod = Math.max(1, Math.ceil((dateRange.previousEndDate.getTime() - dateRange.previousStartDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate current period metrics
    const totalWorkoutTime = currentActivities.reduce((total, activity) => total + activity.duration, 0);
    const totalCaloriesBurned = Math.round(currentActivities.reduce((total, activity) => total + (activity.caloriesBurned || 0), 0));
    const activityCount = currentActivities.length;
    
    // Calculate previous period metrics for comparison
    const previousTotalWorkoutTime = previousActivities.reduce((total, activity) => total + activity.duration, 0);
    const previousTotalCaloriesBurned = Math.round(previousActivities.reduce((total, activity) => total + (activity.caloriesBurned || 0), 0));
    const previousActivityCount = previousActivities.length;
    
    // Calculate daily averages
    const avgWorkoutTimePerDay = Math.round(totalWorkoutTime / daysInCurrentPeriod);
    const avgCaloriesPerDay = Math.round(totalCaloriesBurned / daysInCurrentPeriod);
    
    const previousAvgWorkoutTimePerDay = Math.round(previousTotalWorkoutTime / daysInPreviousPeriod);
    const previousAvgCaloriesPerDay = Math.round(previousTotalCaloriesBurned / daysInPreviousPeriod);
    
    // Calculate percentage changes
    const workoutTimeChange = previousTotalWorkoutTime === 0 
      ? 100 
      : Math.round(((totalWorkoutTime - previousTotalWorkoutTime) / previousTotalWorkoutTime) * 100);
    
    const workoutTimePerDayChange = previousAvgWorkoutTimePerDay === 0 
      ? 100 
      : Math.round(((avgWorkoutTimePerDay - previousAvgWorkoutTimePerDay) / previousAvgWorkoutTimePerDay) * 100);
    
    const caloriesBurnedChange = previousTotalCaloriesBurned === 0 
      ? 100 
      : Math.round(((totalCaloriesBurned - previousTotalCaloriesBurned) / previousTotalCaloriesBurned) * 100);
    
    const caloriesBurnedPerDayChange = previousAvgCaloriesPerDay === 0 
      ? 100 
      : Math.round(((avgCaloriesPerDay - previousAvgCaloriesPerDay) / previousAvgCaloriesPerDay) * 100);
    
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
        calories: Math.round(data.totalCalories), 
        count: data.count 
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3);

    // Create period-specific descriptions
    const workoutTimeDescription = period === 'daily'
      ? 'Total workout time today'
      : period === 'weekly'
        ? 'Total workout time this week'
        : 'Total workout time this month';
        
    const caloriesDescription = period === 'daily'
      ? 'Calories burned today'
      : period === 'weekly'
        ? 'Calories burned this week'
        : 'Calories burned this month';

    return {
      period,
      periodLabel: this.getPeriodLabel(period, dateRange.startDate),
      periodRange: {
        start: dateRange.startDate.toISOString(),
        end: dateRange.endDate.toISOString(),
        daysInPeriod: daysInCurrentPeriod
      },
      stats: {
        workoutTime: {
          total: totalWorkoutTime,
          average: avgWorkoutTimePerDay,
          unit: 'minutes',
          change: workoutTimeChange,
          averageChange: workoutTimePerDayChange,
          label: `Total workout time (${period})`,
          description: workoutTimeDescription
        },
        caloriesBurned: {
          total: totalCaloriesBurned,
          average: avgCaloriesPerDay,
          unit: 'kcal',
          change: caloriesBurnedChange,
          averageChange: caloriesBurnedPerDayChange,
          label: `Total calories burned (${period})`,
          description: caloriesDescription
        },
        activityCount: {
          total: activityCount,
          average: Math.round(activityCount / daysInCurrentPeriod * 10) / 10,
          change: activityCountChange,
          label: `Activities (${period})`
        }
      },
      topActivities,
      breakdown: {
        byDay: this.getCalorieBreakdownByDay(currentActivities, dateRange),
        byActivity: Object.entries(activityTypes).map(([title, data]) => ({
          title,
          calories: Math.round(data.totalCalories),
          duration: data.totalDuration,
          count: data.count,
          percentage: totalCaloriesBurned === 0 ? 0 : Math.round((data.totalCalories / totalCaloriesBurned) * 100)
        }))
      }
    };
  }

  // Helper method to get calories burned by day for the period
  private getCalorieBreakdownByDay(activities: any[], dateRange: { startDate: Date, endDate: Date }) {
    const result: Record<string, number> = {};
    
    // Initialize all days in the range with 0 calories
    let currentDate = new Date(dateRange.startDate);
    while (currentDate <= dateRange.endDate) {
      result[format(currentDate, 'yyyy-MM-dd')] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sum calories for each day
    activities.forEach(activity => {
      const activityDate = format(new Date(activity.createdAt), 'yyyy-MM-dd');
      if (result[activityDate] !== undefined) {
        result[activityDate] += Math.round(activity.caloriesBurned || 0);
      }
    });
    
    // Convert to array format
    return Object.entries(result).map(([date, calories]) => ({
      date,
      calories,
      label: format(new Date(date), 'MMM d')
    }));
  }

  async getNutritionSummary(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly', date?: string) {
    const dateRange = this.getDateRangeForPeriod(period, date);

    const [currentFoodLogs, previousFoodLogs] = await Promise.all([
      this.foodLogModel.find({
        userId,
        date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
      }),
      this.foodLogModel.find({
        userId,
        date: { $gte: dateRange.previousStartDate, $lte: dateRange.previousEndDate }
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
    const daysInPeriod = Math.max(1, Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgCaloriesPerDay = Math.round(totalCalories / daysInPeriod);
    const avgProteinPerDay = Math.round(totalProtein / daysInPeriod);
    const avgCarbsPerDay = Math.round(totalCarbs / daysInPeriod);
    const avgFatsPerDay = Math.round(totalFats / daysInPeriod);

    // Calculate macronutrient distribution
    const totalMacros = totalProtein + totalCarbs + totalFats;
    const proteinPercentage = totalMacros === 0 ? 0 : Math.round((totalProtein / totalMacros) * 100);
    const carbsPercentage = totalMacros === 0 ? 0 : Math.round((totalCarbs / totalMacros) * 100);
    const fatsPercentage = totalMacros === 0 ? 0 : Math.round((totalFats / totalMacros) * 100);

    return {
      period,
      periodLabel: this.getPeriodLabel(period, dateRange.startDate),
      periodRange: {
        start: dateRange.startDate.toISOString(),
        end: dateRange.endDate.toISOString(),
        daysInPeriod
      },
      stats: {
        calories: {
          total: totalCalories,
          average: avgCaloriesPerDay,
          unit: 'kcal',
          change: caloriesChange,
          label: `Total calories consumed (${period})`,
          description: period === 'daily' 
            ? 'Calories consumed today' 
            : period === 'weekly' 
              ? 'Calories consumed this week' 
              : 'Calories consumed this month'
        },
        protein: {
          total: totalProtein,
          average: avgProteinPerDay,
          unit: 'g',
          change: proteinChange,
          percentage: proteinPercentage,
          label: `Protein (${period})`
        },
        carbs: {
          total: totalCarbs,
          average: avgCarbsPerDay,
          unit: 'g',
          change: carbsChange,
          percentage: carbsPercentage,
          label: `Carbs (${period})`
        },
        fats: {
          total: totalFats,
          average: avgFatsPerDay,
          unit: 'g',
          change: fatsChange,
          percentage: fatsPercentage,
          label: `Fats (${period})`
        }
      },
      macroDistribution: {
        protein: proteinPercentage,
        carbs: carbsPercentage,
        fats: fatsPercentage
      },
      breakdown: {
        byDay: this.getNutritionBreakdownByDay(currentFoodLogs, dateRange),
        byMeal: this.getNutritionBreakdownByMeal(currentFoodLogs)
      }
    };
  }

  // Helper method to get nutrition breakdown by day
  private getNutritionBreakdownByDay(foodLogs: any[], dateRange: { startDate: Date, endDate: Date }) {
    const result: Record<string, { calories: number, protein: number, carbs: number, fats: number }> = {};
    
    // Initialize all days in the range
    let currentDate = new Date(dateRange.startDate);
    while (currentDate <= dateRange.endDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      result[dateKey] = { calories: 0, protein: 0, carbs: 0, fats: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sum nutrition for each day
    foodLogs.forEach(log => {
      try {
        const logDate = new Date(log.date);
        // Verify date is valid
        if (isNaN(logDate.getTime())) {
          console.warn('Invalid food log date:', log.date);
          return; // Skip this log
        }
        
        const dateKey = format(logDate, 'yyyy-MM-dd');
        if (result[dateKey]) {
          result[dateKey].calories += log.calories;
          result[dateKey].protein += log.protein;
          result[dateKey].carbs += log.carbs;
          result[dateKey].fats += log.fats;
        }
      } catch (error) {
        console.warn('Error processing food log date:', error);
      }
    });
    
    // Convert to array format with formatted labels
    return Object.entries(result).map(([date, data]) => ({
      date,
      calories: Math.round(data.calories),
      protein: Math.round(data.protein),
      carbs: Math.round(data.carbs),
      fats: Math.round(data.fats),
      label: format(new Date(date), 'MMM d')
    }));
  }

  // Helper method to group nutrition by meal type or title
  private getNutritionBreakdownByMeal(foodLogs: any[]) {
    const mealGroups: Record<string, { 
      count: number, 
      calories: number, 
      protein: number, 
      carbs: number, 
      fats: number 
    }> = {};
    
    // Group by meal title
    foodLogs.forEach(log => {
      const mealTitle = log.title || 'Unlabeled Meal';
      
      if (!mealGroups[mealTitle]) {
        mealGroups[mealTitle] = {
          count: 0,
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0
        };
      }
      
      mealGroups[mealTitle].count++;
      mealGroups[mealTitle].calories += log.calories;
      mealGroups[mealTitle].protein += log.protein;
      mealGroups[mealTitle].carbs += log.carbs;
      mealGroups[mealTitle].fats += log.fats;
    });
    
    // Convert to array and calculate percentages
    const totalCalories = Object.values(mealGroups).reduce((sum, group) => sum + group.calories, 0);
    
    return Object.entries(mealGroups).map(([title, data]) => ({
      title,
      count: data.count,
      calories: Math.round(data.calories),
      protein: Math.round(data.protein),
      carbs: Math.round(data.carbs),
      fats: Math.round(data.fats),
      percentage: totalCalories === 0 ? 0 : Math.round((data.calories / totalCalories) * 100)
    }));
  }

  async getSleepSummary(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly', date?: string) {
    try {
      const dateRange = this.getDateRangeForPeriod(period, date);

      // Fetch sleep logs for current and previous periods
      const [currentSleepLogs, previousSleepLogs] = await Promise.all([
        this.sleepLogModel.find({
          userID: userId,
          startTime: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }),
        this.sleepLogModel.find({
          userID: userId,
          startTime: { $gte: dateRange.previousStartDate, $lte: dateRange.previousEndDate }
        })
      ]);

      // Calculate days in period for proper averaging
      const daysInCurrentPeriod = Math.max(1, Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysInPreviousPeriod = Math.max(1, Math.ceil((dateRange.previousEndDate.getTime() - dateRange.previousStartDate.getTime()) / (1000 * 60 * 60 * 24)));

      // Helper function to convert duration to hours, handling both minutes and hour inputs
      const convertToHours = (durationValue: number): number => {
        if (durationValue === undefined || durationValue === null) return 0;
        // If duration is already small (likely already in hours), return as is
        if (durationValue < 24) {
          return durationValue;
        } 
        // Otherwise assume it's in minutes and convert to hours
        return parseFloat((durationValue / 60).toFixed(1));
      };

      // Filter out logs with invalid startTime and process remaining logs
      const processedCurrentLogs = currentSleepLogs
        .filter(log => log && log.startTime && !isNaN(new Date(log.startTime).getTime()))
        .map(log => ({
          ...log.toObject ? log.toObject() : log,
          durationHours: convertToHours(log.duration)
        }));

      const processedPreviousLogs = previousSleepLogs
        .filter(log => log && log.startTime && !isNaN(new Date(log.startTime).getTime()))
        .map(log => ({
          ...log.toObject ? log.toObject() : log,
          durationHours: convertToHours(log.duration)
        }));

      // CURRENT PERIOD CALCULATIONS
      const totalSleepDuration = processedCurrentLogs.reduce((total, log) => 
        total + (isNaN(log.durationHours) ? 0 : log.durationHours), 0);
      
      // Calculate sleep days with valid dates
      const currentDaysWithSleep = new Set();
      processedCurrentLogs.forEach(log => {
        try {
          const date = new Date(log.startTime);
          if (isValid(date)) {
            currentDaysWithSleep.add(format(date, 'yyyy-MM-dd'));
          }
        } catch (e) {
          // Silently skip invalid dates
        }
      });
      
      // Calculate average sleep duration based on period type
      let avgSleepDuration: number;
      if (period === 'daily') {
        avgSleepDuration = totalSleepDuration; // For daily, use total
      } else {
        // For weekly/monthly, use days with actual sleep logs for the average
        const daysWithLogs = currentDaysWithSleep.size;
        avgSleepDuration = daysWithLogs > 0
          ? parseFloat((totalSleepDuration / daysWithLogs).toFixed(1))
          : 0;
      }
      
      // Calculate average sleep rating
      const totalRating = processedCurrentLogs.reduce((sum, log) => 
        sum + (isNaN(log.rating) ? 0 : log.rating), 0);
      const avgSleepRating = processedCurrentLogs.length > 0
        ? parseFloat((totalRating / processedCurrentLogs.length).toFixed(1))
        : 0;

      // PREVIOUS PERIOD CALCULATIONS
      const previousTotalSleepDuration = processedPreviousLogs.reduce((total, log) => 
        total + (isNaN(log.durationHours) ? 0 : log.durationHours), 0);
      
      // Calculate previous sleep days with valid dates
      const previousDaysWithSleep = new Set();
      processedPreviousLogs.forEach(log => {
        try {
          const date = new Date(log.startTime);
          if (isValid(date)) {
            previousDaysWithSleep.add(format(date, 'yyyy-MM-dd'));
          }
        } catch (e) {
          // Silently skip invalid dates
        }
      });
      
      // Calculate previous average sleep duration based on period type
      let previousAvgSleepDuration: number;
      if (period === 'daily') {
        previousAvgSleepDuration = previousTotalSleepDuration; // For daily, use total
      } else {
        // For weekly/monthly, use days with actual sleep logs for the average
        const prevDaysWithLogs = previousDaysWithSleep.size;
        previousAvgSleepDuration = prevDaysWithLogs > 0
          ? parseFloat((previousTotalSleepDuration / prevDaysWithLogs).toFixed(1))
          : 0;
      }
      
      // Calculate previous average sleep rating
      const previousTotalRating = processedPreviousLogs.reduce((sum, log) => 
        sum + (isNaN(log.rating) ? 0 : log.rating), 0);
      const previousAvgSleepRating = processedPreviousLogs.length > 0
        ? parseFloat((previousTotalRating / processedPreviousLogs.length).toFixed(1))
        : 0;

      // CALCULATE CHANGES AND METRICS
      // Calculate percentage changes with safety checks
      const durationChange = previousAvgSleepDuration <= 0
        ? 0 // Avoid division by zero or negative values
        : Math.round(((avgSleepDuration - previousAvgSleepDuration) / previousAvgSleepDuration) * 100);
      
      const ratingChange = previousAvgSleepRating <= 0
        ? 0 // Avoid division by zero or negative values
        : Math.round(((avgSleepRating - previousAvgSleepRating) / previousAvgSleepRating) * 100);

      // Calculate consistency (percentage of days with sleep logs)
      const consistencyValue = Math.min(100, Math.round((currentDaysWithSleep.size / daysInCurrentPeriod) * 100));

      // Calculate quality distribution with safe checks
      const qualityDistribution = {
        excellent: processedCurrentLogs.filter(log => log.rating === 5).length,
        good: processedCurrentLogs.filter(log => log.rating === 4).length,
        average: processedCurrentLogs.filter(log => log.rating === 3).length,
        poor: processedCurrentLogs.filter(log => log.rating === 2).length,
        veryPoor: processedCurrentLogs.filter(log => log.rating === 1).length
      };
      
      // Create period-specific descriptions
      const avgDurationDescription = period === 'daily'
        ? 'Total sleep duration today'
        : period === 'weekly'
          ? 'Average sleep duration per day with logs this week'
          : 'Average sleep duration per day with logs this month';

      return {
        period,
        periodLabel: this.getPeriodLabel(period, dateRange.startDate),
        periodRange: {
          start: dateRange.startDate.toISOString(),
          end: dateRange.endDate.toISOString(),
          daysInPeriod: daysInCurrentPeriod
        },
        stats: {
          totalSleep: {
            value: parseFloat(totalSleepDuration.toFixed(1)),
            unit: 'hours',
            label: `Total sleep (${period})`,
            description: period === 'daily' 
              ? 'Total sleep today' 
              : period === 'weekly' 
                ? 'Total sleep this week' 
                : 'Total sleep this month'
          },
          avgDuration: {
            value: avgSleepDuration,
            unit: 'hours',
            change: durationChange,
            label: `Avg sleep duration (${period})`,
            description: avgDurationDescription
          },
          avgRating: {
            value: avgSleepRating,
            scale: '5',
            change: ratingChange,
            label: 'Sleep quality'
          },
          consistency: {
            value: consistencyValue,
            unit: '%',
            label: 'Sleep tracking consistency'
          }
        },
        qualityDistribution,
        breakdown: {
          byDay: this.getSleepBreakdownByDay(currentSleepLogs, dateRange),
          qualityTrend: this.getSleepQualityTrend(currentSleepLogs, dateRange)
        }
      };
    } catch (error) {
      console.error('Error generating sleep summary:', error);
      // Return a minimal valid response in case of errors
      return {
        period,
        periodLabel: period,
        periodRange: {
          start: new Date().toISOString(),
          end: new Date().toISOString(),
          daysInPeriod: 1
        },
        stats: {
          totalSleep: { value: 0, unit: 'hours', label: 'Total sleep', description: 'No data available' },
          avgDuration: { value: 0, unit: 'hours', change: 0, label: 'Avg sleep duration', description: 'No data available' },
          avgRating: { value: 0, scale: '5', change: 0, label: 'Sleep quality' },
          consistency: { value: 0, unit: '%', label: 'Sleep tracking consistency' }
        },
        qualityDistribution: {
          excellent: 0,
          good: 0,
          average: 0,
          poor: 0,
          veryPoor: 0
        },
        breakdown: {
          byDay: [],
          qualityTrend: []
        }
      };
    }
  }

  // Helper method to get sleep breakdown by day
  private getSleepBreakdownByDay(sleepLogs: any[], dateRange: { startDate: Date, endDate: Date }) {
    try {
      const result: Record<string, { duration: number, rating: number, count: number }> = {};
      
      // Initialize all days in the range
      let currentDate = new Date(dateRange.startDate);
      while (currentDate <= dateRange.endDate) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        result[dateKey] = { duration: 0, rating: 0, count: 0 };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Helper function to convert duration to hours, handling both minutes and hour inputs
      const convertToHours = (durationValue: number): number => {
        if (durationValue === undefined || durationValue === null) return 0;
        // If duration is already small (likely already in hours), return as is
        if (durationValue < 24) {
          return durationValue;
        } 
        // Otherwise assume it's in minutes and convert to hours
        return parseFloat((durationValue / 60).toFixed(1));
      };
      
      // Sum sleep metrics for each day
      sleepLogs.forEach(log => {
        if (!log || !log.startTime) return; // Skip invalid logs
        
        try {
          const startTime = new Date(log.startTime);
          // Verify date is valid
          if (isNaN(startTime.getTime())) {
            return; // Skip this log
          }
          
          const logDate = format(startTime, 'yyyy-MM-dd');
          if (result[logDate]) {
            const durationHours = convertToHours(log.duration || 0);
            const rating = isNaN(log.rating) ? 0 : log.rating;
            
            result[logDate].duration += durationHours;
            result[logDate].rating += rating;
            result[logDate].count++;
          }
        } catch (error) {
          // Skip invalid entries silently
        }
      });
      
      // Calculate averages and format
      return Object.entries(result).map(([date, data]) => {
        const avgRating = data.count > 0 ? Math.round((data.rating / data.count) * 10) / 10 : 0;
        
        return {
          date,
          duration: parseFloat(data.duration.toFixed(1)),
          rating: avgRating,
          label: format(new Date(date), 'MMM d')
        };
      });
    } catch (error) {
      console.error('Error processing sleep breakdown by day:', error);
      return []; // Return empty array on error
    }
  }

  // Helper method to get sleep quality trend
  private getSleepQualityTrend(sleepLogs: any[], dateRange: { startDate: Date, endDate: Date }) {
    try {
      if (!sleepLogs || sleepLogs.length === 0) return [];

      // Helper function to convert duration to hours, handling both minutes and hour inputs
      const convertToHours = (durationValue: number): number => {
        if (durationValue === undefined || durationValue === null) return 0;
        // If duration is already small (likely already in hours), return as is
        if (durationValue < 24) {
          return durationValue;
        } 
        // Otherwise assume it's in minutes and convert to hours
        return parseFloat((durationValue / 60).toFixed(1));
      };
      
      // Filter valid logs and sort by date
      const sortedLogs = sleepLogs
        .filter(log => {
          if (!log || !log.startTime) return false;
          
          try {
            const date = new Date(log.startTime);
            return isValid(date); // Only include logs with valid dates
          } catch (error) {
            return false;
          }
        })
        .sort((a, b) => {
          const dateA = new Date(a.startTime);
          const dateB = new Date(b.startTime);
          return dateA.getTime() - dateB.getTime();
        });
      
      // Return the quality trend data
      return sortedLogs.map(log => {
        try {
          const startTime = new Date(log.startTime);
          const rating = isNaN(log.rating) ? 0 : log.rating;
          
          return {
            date: format(startTime, 'yyyy-MM-dd'),
            rating,
            duration: convertToHours(log.duration),
            label: format(startTime, 'MMM d, h:mm a')
          };
        } catch (error) {
          return null;
        }
      }).filter(item => item !== null);
    } catch (error) {
      console.error('Error processing sleep quality trend:', error);
      return []; // Return empty array on error
    }
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
    
    // Activity stats for the last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    const last30DaysActivities = await this.userActivityModel.countDocuments({
      user: userId,
      createdAt: { $gte: thirtyDaysAgo }
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

  private getPeriodLabel(period: 'daily' | 'weekly' | 'monthly', date: Date = new Date()): string {
    switch(period) {
      case 'daily':
        return format(date, 'MMMM d, yyyy');
      case 'weekly':
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'monthly':
        return format(date, 'MMMM yyyy');
      default:
        return '';
    }
  }
} 