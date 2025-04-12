import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';
export declare enum FitnessLevel {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced"
}
export declare enum FitnessGoal {
    WEIGHT_LOSS = "weight_loss",
    MUSCLE_GAIN = "muscle_gain",
    STRENGTH = "strength",
    ENDURANCE = "endurance",
    FLEXIBILITY = "flexibility",
    GENERAL_FITNESS = "general_fitness"
}
export declare class FitnessProfile extends Document {
    userId: User;
    fitnessLevel: FitnessLevel;
    fitnessGoals: FitnessGoal[];
    preferredActivities: string[];
    height?: number;
    weight?: number;
    targetWeight?: number;
    hasInjuries: boolean;
    injuries: string[];
    availableWorkoutDays: number;
    preferredWorkoutDuration: number;
    hasGymAccess: boolean;
    availableEquipment: string[];
}
export declare const FitnessProfileSchema: MongooseSchema<FitnessProfile, import("mongoose").Model<FitnessProfile, any, any, any, Document<unknown, any, FitnessProfile> & FitnessProfile & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FitnessProfile, Document<unknown, {}, import("mongoose").FlatRecord<FitnessProfile>> & import("mongoose").FlatRecord<FitnessProfile> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
