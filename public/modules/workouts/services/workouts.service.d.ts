import { Model } from 'mongoose';
import { FitnessProfile } from '../interfaces/fitness-profile.interface';
import { WorkoutPlan } from '../interfaces/workout-plan.interface';
import { CreateFitnessProfileDto } from '../dto/create-fitness-profile.dto';
import { GenerateWorkoutPlanDto } from '../dto/generate-workout-plan.dto';
import { AiWorkoutService } from './ai-workout.service';
export declare class WorkoutsService {
    private fitnessProfileModel;
    private workoutPlanModel;
    private readonly aiWorkoutService;
    constructor(fitnessProfileModel: Model<FitnessProfile>, workoutPlanModel: Model<WorkoutPlan>, aiWorkoutService: AiWorkoutService);
    createOrUpdateFitnessProfile(userId: string, profileDto: CreateFitnessProfileDto): Promise<FitnessProfile>;
    getFitnessProfile(userId: string): Promise<FitnessProfile>;
    generateWorkoutPlan(userId: string, generateDto: GenerateWorkoutPlanDto): Promise<WorkoutPlan>;
    getUserWorkoutPlans(userId: string): Promise<WorkoutPlan[]>;
    getWorkoutPlan(workoutPlanId: string): Promise<WorkoutPlan>;
    rateWorkoutPlan(workoutPlanId: string, rating: number): Promise<WorkoutPlan>;
    deleteWorkoutPlan(workoutPlanId: string): Promise<void>;
    trackWorkoutPlanUsage(workoutPlanId: string): Promise<WorkoutPlan>;
    getRecommendedWorkoutPlans(userId: string): Promise<WorkoutPlan[]>;
}
