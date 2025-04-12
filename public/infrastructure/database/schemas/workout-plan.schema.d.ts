import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
export declare enum WorkoutType {
    STRENGTH = "strength",
    CARDIO = "cardio",
    FLEXIBILITY = "flexibility",
    HIIT = "hiit",
    CIRCUIT = "circuit",
    CUSTOM = "custom"
}
export declare enum WorkoutDifficulty {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced"
}
export declare class Exercise {
    name: string;
    description?: string;
    sets: number;
    reps: string;
    restBetweenSets?: string;
    targetMuscles: string[];
    requiredEquipment: string[];
    notes?: string;
    imageUrl?: string;
    videoUrl?: string;
}
export declare class WorkoutDay {
    day: string;
    focus: string;
    warmup?: string;
    exercises: Exercise[];
    cooldown?: string;
    duration?: number;
    notes?: string;
}
export declare class WorkoutPlan extends Document {
    name: string;
    description?: string;
    userId?: User;
    type: WorkoutType;
    difficulty: WorkoutDifficulty;
    goals: string[];
    targetAreas: string[];
    workoutDays: WorkoutDay[];
    isAiGenerated: boolean;
    duration: number;
    averageWorkoutTime: number;
    requiresEquipment: boolean;
    requiredEquipment: string[];
    rating: number;
    timesUsed: number;
}
export declare const WorkoutPlanSchema: MongooseSchema<WorkoutPlan, import("mongoose").Model<WorkoutPlan, any, any, any, Document<unknown, any, WorkoutPlan> & WorkoutPlan & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WorkoutPlan, Document<unknown, {}, import("mongoose").FlatRecord<WorkoutPlan>> & import("mongoose").FlatRecord<WorkoutPlan> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
