import { WorkoutDifficulty, WorkoutType } from '../../../infrastructure/database/schemas/workout-plan.schema';
export declare class GenerateWorkoutPlanDto {
    workoutType: WorkoutType;
    difficulty: WorkoutDifficulty;
    goals: string[];
    targetAreas?: string[];
    duration: number;
    daysPerWeek: number;
    workoutDuration: number;
    availableEquipment?: string[];
    limitations?: string[];
    hasGymAccess?: boolean;
}
