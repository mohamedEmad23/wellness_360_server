import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Error, Model } from 'mongoose';
import { FitnessProfile } from '../interfaces/fitness-profile.interface';
import { WorkoutPlan } from '../interfaces/workout-plan.interface';
import { CreateFitnessProfileDto } from '../dto/create-fitness-profile.dto';
import { GenerateWorkoutPlanDto } from '../dto/generate-workout-plan.dto';
import { AiWorkoutService } from './ai-workout.service';
import { CaloriesService } from './calories.service';
import { CaloriesTrackingService } from './calories-tracking.service';
import { ActivityTrackingService } from './activity-tracking.service';
import { FitnessProfile as FitnessProfileSchema } from '../../../infrastructure/database/schemas/fitness-profile.schema';
import { 
  WorkoutPlan as WorkoutPlanSchema, 
  WorkoutType, 
  WorkoutDifficulty 
} from '../../../infrastructure/database/schemas/workout-plan.schema';
import { User } from '../../../infrastructure/database/schemas/user.schema';
import { FitnessGoal, FitnessLevel } from '../../../infrastructure/database/schemas/fitness-profile.schema';
import { WorkoutNotificationService } from '../../Notifications/services/workout-notification.service';

// Interface for custom workout plan options
interface WorkoutPlanCustomOptions {
  workoutType?: WorkoutType;
}

@Injectable()
export class WorkoutsService {
  private readonly logger = new Logger(WorkoutsService.name);

  constructor(
    @InjectModel(FitnessProfileSchema.name)
    private fitnessProfileModel: Model<FitnessProfile>,

    @InjectModel(WorkoutPlanSchema.name)
    private workoutPlanModel: Model<WorkoutPlan>,

    @InjectModel(User.name)
    private userModel: Model<User>,

    private readonly aiWorkoutService: AiWorkoutService,
    private readonly caloriesService: CaloriesService,
    private readonly caloriesTrackingService: CaloriesTrackingService,
    private readonly activityTrackingService: ActivityTrackingService,
    private readonly workoutNotificationService: WorkoutNotificationService,
  ) {}

  async createOrUpdateFitnessProfile(
    userId: string,
    profileDto: CreateFitnessProfileDto,
  ): Promise<FitnessProfile> {
    try {
      this.logger.debug(`Creating/updating fitness profile for user ${userId}`);
      
      // Get user data from the user model
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const existingProfile = await this.fitnessProfileModel.findOne({ userId });

      if (existingProfile) {
        Object.assign(existingProfile, profileDto);
        
        // Add user data from the user model
        existingProfile.height = user.height;
        existingProfile.weight = user.weight;
        existingProfile.age = user.age;
        existingProfile.gender = user.gender;
        
        return await existingProfile.save();
      }

      const newProfile = new this.fitnessProfileModel({ 
        userId, 
        ...profileDto,
        height: user.height,
        weight: user.weight,
        age: user.age,
        gender: user.gender,
      });
      
      return await newProfile.save();
    } catch (error) {
      this.logger.error(`Error creating/updating fitness profile: ${error.message}`, error.stack);
      
      if (error instanceof Error.ValidationError) {
        const errorMessages = Object.values(error.errors).map((err) => err.message);
        throw new BadRequestException({
          message: 'Fitness profile validation failed',
          errors: errorMessages,
        });
      }
      throw error;
    }
  }

  async getFitnessProfile(userId: string): Promise<FitnessProfile> {
    const profile = await this.fitnessProfileModel.findOne({ userId });
    if (!profile) {
      throw new NotFoundException('Fitness profile not found');
    }
    return profile;
  }

  async generateWorkoutPlan(
    userId: string,
    generateDto: GenerateWorkoutPlanDto,
  ): Promise<WorkoutPlan> {
    try {
      let fitnessProfile: FitnessProfile | null = null;
      try {
        fitnessProfile = await this.getFitnessProfile(userId);
      } catch {
        // No fitness profile found — continue without it
      }

      const workoutPlanData = await this.aiWorkoutService.generateWorkoutPlan(
        generateDto,
        fitnessProfile,
        userId
      );

      const workoutPlan = new this.workoutPlanModel({ ...workoutPlanData, userId });
      return await workoutPlan.save();
    } catch (error) {
      if (error instanceof Error.ValidationError) {
        const errorMessages = Object.values(error.errors).map((err) => err.message);
        throw new BadRequestException({
          message: 'Workout plan validation failed',
          errors: errorMessages,
        });
      }
      throw error;
    }
  }

  async getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    return this.workoutPlanModel.find({ userId }).sort({ createdAt: -1 });
  }

  async getWorkoutPlan(workoutPlanId: string): Promise<WorkoutPlan> {
    const workoutPlan = await this.workoutPlanModel.findById(workoutPlanId);
    if (!workoutPlan) {
      throw new NotFoundException('Workout plan not found');
    }
    return workoutPlan;
  }

  async rateWorkoutPlan(
    workoutPlanId: string,
    rating: number,
  ): Promise<WorkoutPlan> {
    try {
      const workoutPlan = await this.getWorkoutPlan(workoutPlanId);
      workoutPlan.rating = rating;
      return await workoutPlan.save();
    } catch (error) {
      if (error instanceof Error.ValidationError) {
        throw new BadRequestException('Invalid rating format');
      }
      throw error;
    }
  }

  async deleteWorkoutPlan(workoutPlanId: string): Promise<void> {
    const result = await this.workoutPlanModel.deleteOne({ _id: workoutPlanId });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Workout plan not found');
    }
  }

  async trackWorkoutPlanUsage(workoutPlanId: string): Promise<WorkoutPlan> {
    const workoutPlan = await this.getWorkoutPlan(workoutPlanId);
    workoutPlan.timesUsed += 1;
    return workoutPlan.save();
  }

  async getRecommendedWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    try {
      const profile = await this.getFitnessProfile(userId);
      return this.workoutPlanModel
        .find({ difficulty: profile.fitnessLevel })
        .limit(5);
    } catch {
      return this.workoutPlanModel.find().sort({ rating: -1 }).limit(5);
    }
  }

  async generateWorkoutPlanFromProfile(
    userId: string, 
    customOptions: WorkoutPlanCustomOptions = {}
  ): Promise<WorkoutPlan> {
    try {
      // Get the user's fitness profile
      const fitnessProfile = await this.getFitnessProfile(userId);
      if (!fitnessProfile) {
        throw new NotFoundException('Fitness profile not found');
      }

      // Get user data
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Delete any existing workout plans for this user
      this.logger.debug(`Deleting existing workout plans for user ${userId}`);
      await this.workoutPlanModel.deleteMany({ userId });

      // Create workout generation parameters from profile
      const generateDto: GenerateWorkoutPlanDto = {
        workoutType: customOptions.workoutType || this.determineWorkoutType(fitnessProfile),
        difficulty: this.mapFitnessLevelToDifficulty(fitnessProfile.fitnessLevel),
        goals: fitnessProfile.fitnessGoals.map(goal => goal.toString()),
        targetAreas: [],
        duration: 4, // Default 4 weeks
        daysPerWeek: 7, // Always generate 7-day plans
        workoutDuration: fitnessProfile.preferredWorkoutDuration,
        availableEquipment: fitnessProfile.availableEquipment,
        limitations: fitnessProfile.hasInjuries ? fitnessProfile.injuries : [],
        hasGymAccess: fitnessProfile.hasGymAccess
      };

      this.logger.debug(`Generating 7-day workout plan with type: ${generateDto.workoutType}`);

      // Generate workout plan using existing method
      const workoutPlanData = await this.aiWorkoutService.generateWorkoutPlan(
        generateDto,
        fitnessProfile,
        userId
      );

      // Ensure we have 7 days in the plan
      const workoutPlan = new this.workoutPlanModel({ 
        ...workoutPlanData, 
        userId 
      });
      
      // Initialize completion status for each day
      workoutPlan.workoutDays = workoutPlan.workoutDays.map(day => ({
        ...day,
        isCompleted: false,
        completedAt: null
      }));
      
      // Check if we have 7 days in the workout plan
      if (workoutPlan.workoutDays && workoutPlan.workoutDays.length < 7) {
        this.logger.warn(`Workout plan has less than 7 days (${workoutPlan.workoutDays.length}). Adding rest days to complete the week.`);
        
        // Add rest days if needed to complete the 7-day week
        while (workoutPlan.workoutDays.length < 7) {
          const dayNumber = workoutPlan.workoutDays.length + 1;
          workoutPlan.workoutDays.push({
            day: `Day ${dayNumber}`,
            focus: 'Rest and Recovery',
            warmup: 'Light stretching and mobility work',
            exercises: [],
            cooldown: 'Foam rolling and static stretching',
            duration: 20,
            notes: 'Rest days are crucial for recovery and muscle growth. Stay hydrated and focus on good nutrition.',
            isCompleted: false,
            completedAt: null
          });
        }
      }
      
      // Save to database
      await workoutPlan.save();
      
      this.logger.debug(`Successfully generated and saved ${workoutPlan.workoutDays.length}-day workout plan`);
      return workoutPlan;
    } catch (error) {
      this.logger.error(`Error generating workout plan from profile: ${error.message}`, error.stack);
      
      if (error instanceof Error.ValidationError) {
        const errorMessages = Object.values(error.errors).map((err) => err.message);
        throw new BadRequestException({
          message: 'Workout plan validation failed',
          errors: errorMessages,
        });
      }
      throw error;
    }
  }

  /**
   * Maps fitness level to workout difficulty
   */
  private mapFitnessLevelToDifficulty(fitnessLevel: FitnessLevel): WorkoutDifficulty {
    switch (fitnessLevel) {
      case FitnessLevel.BEGINNER:
        return WorkoutDifficulty.BEGINNER;
      case FitnessLevel.INTERMEDIATE:
        return WorkoutDifficulty.INTERMEDIATE;
      case FitnessLevel.ADVANCED:
        return WorkoutDifficulty.ADVANCED;
      default:
        return WorkoutDifficulty.BEGINNER;
    }
  }

  /**
   * Determines the most appropriate workout type based on user's fitness profile
   */
  private determineWorkoutType(fitnessProfile: FitnessProfile): WorkoutType {
    // Check if the user has any preferred activities that match workout types
    const preferredActivities = fitnessProfile.preferredActivities.map(a => a.toLowerCase());
    
    if (preferredActivities.some(a => ['strength', 'weightlifting', 'resistance', 'muscle'].includes(a))) {
      return WorkoutType.STRENGTH;
    }
    
    if (preferredActivities.some(a => ['cardio', 'running', 'jogging', 'swimming', 'cycling'].includes(a))) {
      return WorkoutType.CARDIO;
    }
    
    if (preferredActivities.some(a => ['flexibility', 'yoga', 'stretching', 'pilates'].includes(a))) {
      return WorkoutType.FLEXIBILITY;
    }
    
    if (preferredActivities.some(a => ['hiit', 'high intensity', 'interval', 'tabata'].includes(a))) {
      return WorkoutType.HIIT;
    }
    
    if (preferredActivities.some(a => ['circuit', 'functional'].includes(a))) {
      return WorkoutType.CIRCUIT;
    }
    
    // Check fitness goals if no matching activities
    const goals = fitnessProfile.fitnessGoals.map(g => g.toString());
    
    if (goals.includes(FitnessGoal.MUSCLE_GAIN) || goals.includes(FitnessGoal.STRENGTH)) {
      return WorkoutType.STRENGTH;
    }
    
    if (goals.includes(FitnessGoal.ENDURANCE)) {
      return WorkoutType.CARDIO;
    }
    
    if (goals.includes(FitnessGoal.FLEXIBILITY)) {
      return WorkoutType.FLEXIBILITY;
    }
    
    if (goals.includes(FitnessGoal.WEIGHT_LOSS)) {
      return WorkoutType.HIIT;
    }
    
    // Default to CIRCUIT as it's well-rounded for general fitness
    return WorkoutType.CIRCUIT;
  }

  /**
   * Mark a workout day as completed and track calories
   */
  async markWorkoutDayAsCompleted(userId: string, dayIndex: number, workoutPlanId?: string): Promise<WorkoutPlan> {
    try {
      // Ensure dayIndex is a valid number
      const validDayIndex = Number(dayIndex);
      
      this.logger.log(`Marking workout day as completed for userId: ${userId}, dayIndex: ${validDayIndex}`);
      
      // Get the current workout plan for the user (only one plan per user)
      const workoutPlan = await this.workoutPlanModel.findOne({ userId }).sort({ createdAt: -1 });
      
      if (!workoutPlan) {
        this.logger.error(`No workout plan found for user ${userId}`);
        throw new NotFoundException('No workout plan found for this user');
      }
      
      this.logger.log(`Found workout plan: ${workoutPlan._id}`);
      
      // More detailed validation of workout days
      if (!workoutPlan.workoutDays) {
        this.logger.error(`Workout plan has no workoutDays array`);
        throw new BadRequestException('Workout plan has no workout days defined');
      }
      
      this.logger.log(`Workout plan has ${workoutPlan.workoutDays.length} days`);
      
      // Use 0 as default if dayIndex is NaN
      const safeIndex = isNaN(validDayIndex) ? 0 : validDayIndex;
      
      if (safeIndex < 0 || safeIndex >= workoutPlan.workoutDays.length) {
        this.logger.error(`Invalid dayIndex: ${safeIndex}. Workout plan has ${workoutPlan.workoutDays.length} days`);
        throw new BadRequestException(`Invalid workout day index. Available range: 0-${workoutPlan.workoutDays.length - 1}`);
      }
      
      const workoutDay = workoutPlan.workoutDays[safeIndex];
      if (!workoutDay) {
        this.logger.error(`Workout day at index ${safeIndex} is undefined even though index is in range`);
        throw new BadRequestException('Invalid workout day');
      }
      
      if (workoutDay.isCompleted) {
        return workoutPlan; // Already completed, no changes needed
      }
      
      // Get user data for calorie calculation
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      // Calculate calories burned for this workout day
      const caloriesBurned = this.caloriesService.calculateCaloriesBurned(
        workoutDay,
        user.weight,
        user.age,
        user.gender
      );
      
      // Mark the day as completed
      workoutDay.isCompleted = true;
      workoutDay.completedAt = new Date();
      workoutDay.caloriesBurned = Math.round(caloriesBurned);
      
      // Track the calories burned
      await this.caloriesTrackingService.updateCaloriesBurned(
        userId, 
        workoutPlan,
        safeIndex,
        caloriesBurned
      );
      
      // Track the activity
      await this.activityTrackingService.recordWorkoutActivity(
        userId, 
        workoutPlan,
        safeIndex,
        caloriesBurned
      );
      
      // Check if this was the last workout in the plan
      const allDaysCompleted = workoutPlan.workoutDays.every(day => day.isCompleted);
      
      // If all workout days are completed, send a notification
      if (allDaysCompleted) {
        await this.workoutNotificationService.sendWorkoutGoalAchievedNotification(
          userId,
          `completed your ${workoutPlan.name} workout plan!`,
          {
            workoutPlanId: workoutPlan._id.toString(),
            workoutPlanName: workoutPlan.name,
            completedAt: new Date()
          }
        );
      } else {
        // Send a workout completion notification
        await this.workoutNotificationService.sendWorkoutGoalAchievedNotification(
          userId,
          `completed your ${workoutDay.focus || workoutDay.day} workout!`,
          {
            workoutPlanId: workoutPlan._id.toString(),
            workoutDay: workoutDay.day,
            caloriesBurned: Math.round(caloriesBurned)
          }
        );
      }
      
      await workoutPlan.save();
      return workoutPlan;
    } catch (error) {
      this.logger.error(`Error marking workout day as completed: ${error.message}`);
      throw error;
    }
  }
  
  // Get user's total calories burned across all workouts
  async getUserTotalCaloriesBurned(userId: string): Promise<number> {
    try {
      const caloriesStats = await this.caloriesTrackingService.getUserCaloriesStats(userId);
      return caloriesStats.totalCaloriesBurned;
    } catch (error) {
      this.logger.error(`Error calculating total calories: ${error.message}`, error.stack);
      return 0;
    }
  }
  
  // Get user's daily calories burned
  async getUserDailyCaloriesBurned(userId: string): Promise<number> {
    try {
      const caloriesStats = await this.caloriesTrackingService.getUserCaloriesStats(userId);
      return caloriesStats.dailyCaloriesBurned;
    } catch (error) {
      this.logger.error(`Error getting daily calories: ${error.message}`, error.stack);
      return 0;
    }
  }
  
  // Get user's weekly calories burned
  async getUserWeeklyCaloriesBurned(userId: string): Promise<number> {
    try {
      const caloriesStats = await this.caloriesTrackingService.getUserCaloriesStats(userId);
      return caloriesStats.weeklyCaloriesBurned;
    } catch (error) {
      this.logger.error(`Error getting weekly calories: ${error.message}`, error.stack);
      return 0;
    }
  }
  
  // Get user's workout history with calories burned
  async getUserWorkoutHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      return await this.caloriesTrackingService.getUserWorkoutSessions(userId, limit);
    } catch (error) {
      this.logger.error(`Error getting workout history: ${error.message}`, error.stack);
      return [];
    }
  }

  // Get user's current workout plan
  async getUserCurrentWorkoutPlan(userId: string): Promise<WorkoutPlan> {
    const workoutPlan = await this.workoutPlanModel.findOne({ userId }).sort({ createdAt: -1 });
    
    if (!workoutPlan) {
      throw new NotFoundException('No workout plan found for this user');
    }
    
    return workoutPlan;
  }
}