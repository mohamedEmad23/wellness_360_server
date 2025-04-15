import { Document } from 'mongoose';
import { WorkoutDifficulty, WorkoutType } from '../../../infrastructure/database/schemas/workout-plan.schema';

export interface Exercise {
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

export interface WorkoutDay {
  day: string;
  focus: string;
  warmup?: string;
  exercises: Exercise[];
  cooldown?: string;
  duration?: number;
  notes?: string;
}

export interface WorkoutPlan extends Document {
  name: string;
  description?: string;
  userId?: string;
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