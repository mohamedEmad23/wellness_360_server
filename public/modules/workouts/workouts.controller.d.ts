import { WorkoutsService } from '../workouts/services/workouts.service';
import { CreateFitnessProfileDto } from '../workouts/dto/create-fitness-profile.dto';
import { GenerateWorkoutPlanDto } from '../workouts/dto/generate-workout-plan.dto';
export declare class WorkoutsController {
    private readonly workoutsService;
    constructor(workoutsService: WorkoutsService);
    createOrUpdateFitnessProfile(req: any, createFitnessProfileDto: CreateFitnessProfileDto): Promise<import("./interfaces/fitness-profile.interface").FitnessProfile>;
    getFitnessProfile(req: any): Promise<import("./interfaces/fitness-profile.interface").FitnessProfile>;
    generateWorkoutPlan(req: any, generateWorkoutPlanDto: GenerateWorkoutPlanDto): Promise<import("./interfaces/workout-plan.interface").WorkoutPlan>;
    getUserWorkoutPlans(req: any): Promise<import("./interfaces/workout-plan.interface").WorkoutPlan[]>;
    getWorkoutPlan(id: string): Promise<import("./interfaces/workout-plan.interface").WorkoutPlan>;
    deleteWorkoutPlan(id: string): Promise<{
        message: string;
    }>;
    rateWorkoutPlan(id: string, rating: number): Promise<import("./interfaces/workout-plan.interface").WorkoutPlan>;
    trackWorkoutPlanUsage(id: string): Promise<import("./interfaces/workout-plan.interface").WorkoutPlan>;
    getRecommendedWorkoutPlans(req: any): Promise<import("./interfaces/workout-plan.interface").WorkoutPlan[]>;
}
