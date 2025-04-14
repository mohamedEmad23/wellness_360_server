import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Error, Model } from 'mongoose';
import { FitnessProfile } from '../interfaces/fitness-profile.interface';
import { WorkoutPlan } from '../interfaces/workout-plan.interface';
import { CreateFitnessProfileDto } from '../dto/create-fitness-profile.dto';
import { GenerateWorkoutPlanDto } from '../dto/generate-workout-plan.dto';
import { AiWorkoutService } from './ai-workout.service';
import { FitnessProfile as FitnessProfileSchema } from '../../../infrastructure/database/schemas/fitness-profile.schema';
import { WorkoutPlan as WorkoutPlanSchema } from '../../../infrastructure/database/schemas/workout-plan.schema';

@Injectable()
export class WorkoutsService {
  constructor(
    @InjectModel(FitnessProfileSchema.name)
    private fitnessProfileModel: Model<FitnessProfile>,
    @InjectModel(WorkoutPlanSchema.name)
    private workoutPlanModel: Model<WorkoutPlan>,
    private readonly aiWorkoutService: AiWorkoutService,
  ) {}

  /**
   * Create or update a user's fitness profile
   */
  async createOrUpdateFitnessProfile(
    userId: string,
    profileDto: CreateFitnessProfileDto,
  ): Promise<FitnessProfile> {
    try {
      // Check if profile already exists
      const existingProfile = await this.fitnessProfileModel.findOne({
        userId,
      });

      if (existingProfile) {
        // Update existing profile
        Object.assign(existingProfile, profileDto);
        return await existingProfile.save();
      } else {
        // Create new profile
        const newProfile = new this.fitnessProfileModel({
          userId,
          ...profileDto,
        });
        return await newProfile.save();
      }
    } catch (error) {
      // Handle Mongoose validation errors
      if (error instanceof Error.ValidationError) {
        const errorMessages = Object.values(error.errors).map(
          (err) => err.message,
        );
        throw new BadRequestException({
          message: 'Fitness profile validation failed',
          errors: errorMessages,
        });
      }
      throw error;
    }
  }

  /**
   * Get a user's fitness profile
   */
  async getFitnessProfile(userId: string): Promise<FitnessProfile> {
    const profile = await this.fitnessProfileModel.findOne({ userId });
    if (!profile) {
      throw new NotFoundException('Fitness profile not found');
    }
    return profile;
  }

  /**
   * Generate a workout plan using AI
   */
  async generateWorkoutPlan(
    userId: string,
    generateDto: GenerateWorkoutPlanDto,
  ): Promise<WorkoutPlan> {
    try {
      // Get user's fitness profile if it exists
      let fitnessProfile: FitnessProfile | null = null;
      try {
        fitnessProfile = await this.getFitnessProfile(userId);
      } catch (error) {
        // If profile doesn't exist, continue without it
      }

      // Generate workout plan using AI
      const workoutPlanData = await this.aiWorkoutService.generateWorkoutPlan(
        generateDto,
        fitnessProfile,
      );

      // Save the generated plan to the database
      const workoutPlan = new this.workoutPlanModel({
        ...workoutPlanData,
        userId,
      });

      return await workoutPlan.save();
    } catch (error) {
      // Handle Mongoose validation errors
      if (error instanceof Error.ValidationError) {
        const errorMessages = Object.values(error.errors).map(
          (err) => err.message,
        );
        throw new BadRequestException({
          message: 'Workout plan validation failed',
          errors: errorMessages,
        });
      }
      throw error;
    }
  }

  /**
   * Get all workout plans for a user
   */
  async getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    return this.workoutPlanModel.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Get a specific workout plan
   */
  async getWorkoutPlan(workoutPlanId: string): Promise<WorkoutPlan> {
    const workoutPlan = await this.workoutPlanModel.findById(workoutPlanId);
    if (!workoutPlan) {
      throw new NotFoundException('Workout plan not found');
    }
    return workoutPlan;
  }

  /**
   * Rate a workout plan
   */
  async rateWorkoutPlan(
    workoutPlanId: string,
    rating: number,
  ): Promise<WorkoutPlan> {
    try {
      const workoutPlan = await this.getWorkoutPlan(workoutPlanId);

      // Simple implementation - just set the rating directly
      // In a real app, you'd track individual user ratings and calculate an average
      workoutPlan.rating = rating;

      return await workoutPlan.save();
    } catch (error) {
      if (error instanceof Error.ValidationError) {
        throw new BadRequestException('Invalid rating format');
      }
      throw error;
    }
  }

  /**
   * Delete a workout plan
   */
  async deleteWorkoutPlan(workoutPlanId: string): Promise<void> {
    const result = await this.workoutPlanModel.deleteOne({
      _id: workoutPlanId,
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Workout plan not found');
    }
  }

  /**
   * Increment the usage count for a workout plan
   */
  async trackWorkoutPlanUsage(workoutPlanId: string): Promise<WorkoutPlan> {
    const workoutPlan = await this.getWorkoutPlan(workoutPlanId);
    workoutPlan.timesUsed += 1;
    return workoutPlan.save();
  }

  /**
   * Get recommended workout plans for a user based on their fitness profile
   */
  async getRecommendedWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
    try {
      // Get user's fitness profile
      const profile = await this.getFitnessProfile(userId);

      // Get all workout plans (in a real app, you'd limit this and add more sophisticated filtering)
      const allWorkoutPlans = await this.workoutPlanModel
        .find({
          difficulty: profile.fitnessLevel,
        })
        .limit(5);

      return allWorkoutPlans;
    } catch (error) {
      // If no profile is found, return some default workout plans
      return this.workoutPlanModel.find().sort({ rating: -1 }).limit(5);
    }
  }
}
