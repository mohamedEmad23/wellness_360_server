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

  async createOrUpdateFitnessProfile(
    userId: string,
    profileDto: CreateFitnessProfileDto,
  ): Promise<FitnessProfile> {
    try {
      const existingProfile = await this.fitnessProfileModel.findOne({ userId });

      if (existingProfile) {
        Object.assign(existingProfile, profileDto);
        return await existingProfile.save();
      }

      const newProfile = new this.fitnessProfileModel({ userId, ...profileDto });
      return await newProfile.save();
    } catch (error) {
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
}