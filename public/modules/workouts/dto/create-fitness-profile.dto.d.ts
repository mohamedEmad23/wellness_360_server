import { FitnessGoal, FitnessLevel } from '../../../infrastructure/database/schemas/fitness-profile.schema';
export declare class CreateFitnessProfileDto {
    fitnessLevel: FitnessLevel;
    fitnessGoals: FitnessGoal[];
    preferredActivities?: string[];
    height?: number;
    weight?: number;
    targetWeight?: number;
    hasInjuries?: boolean;
    injuries?: string[];
    availableWorkoutDays?: number;
    preferredWorkoutDuration?: number;
    hasGymAccess?: boolean;
    availableEquipment?: string[];
}
