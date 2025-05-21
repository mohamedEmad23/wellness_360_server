import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export enum WorkoutType {
  STRENGTH = 'strength',
  CARDIO = 'cardio',
  FLEXIBILITY = 'flexibility',
  HIIT = 'hiit',
  CIRCUIT = 'circuit',
  CUSTOM = 'custom',
}

export enum WorkoutDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Schema()
export class Exercise {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  sets: number;

  @Prop({ required: true })
  reps: string; // Can be a number or a range (e.g., "8-12") or time (e.g., "30 seconds")

  @Prop()
  restBetweenSets?: string;

  @Prop({ type: [String], default: [] })
  targetMuscles: string[];

  @Prop({ type: [String], default: [] })
  requiredEquipment: string[];
  
  @Prop({ type: Number, default: 3.5 })
  metValue: number; // MET value for calorie calculation

  @Prop()
  notes?: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  videoUrl?: string;
}

@Schema()
export class WorkoutDay {
  @Prop({ required: true })
  day: string; // e.g., "Day 1" or "Monday"

  @Prop({ required: true })
  focus: string; // e.g., "Upper Body", "Legs", "Cardio", etc.

  @Prop()
  warmup?: string;

  @Prop({ type: [Exercise], required: true })
  exercises: Exercise[];

  @Prop()
  cooldown?: string;

  @Prop()
  duration?: number; // in minutes

  @Prop()
  notes?: string;
  
  @Prop({ default: false })
  isCompleted?: boolean;
  
  @Prop()
  completedAt?: Date;
  
  @Prop({ type: Number, default: 0 })
  caloriesBurned?: number;
  
  @Prop({ type: String })
  intensityLevel?: 'low' | 'moderate' | 'high';
}

@Schema({ timestamps: true })
export class WorkoutPlan extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId?: User; // Optional: if null, it's a template workout plan

  @Prop({ 
    type: String, 
    enum: Object.values(WorkoutType),
    required: true
  })
  type: WorkoutType;

  @Prop({ 
    type: String, 
    enum: Object.values(WorkoutDifficulty),
    required: true
  })
  difficulty: WorkoutDifficulty;

  @Prop({ type: [String], default: [] })
  goals: string[];

  @Prop({ type: [String], default: [] })
  targetAreas: string[];

  @Prop({ type: [WorkoutDay], required: true })
  workoutDays: WorkoutDay[];

  @Prop({ default: false })
  isAiGenerated: boolean;

  @Prop({ default: 0 })
  duration: number; // in weeks

  @Prop({ default: 0 })
  averageWorkoutTime: number; // in minutes

  @Prop({ default: false })
  requiresEquipment: boolean;

  @Prop({ type: [String], default: [] })
  requiredEquipment: string[];
  
  @Prop({ default: 0 })
  rating: number; // Average user rating (1-5)
  
  @Prop({ default: 0 })
  timesUsed: number; // How many times this plan has been used
}

export const WorkoutPlanSchema = SchemaFactory.createForClass(WorkoutPlan);