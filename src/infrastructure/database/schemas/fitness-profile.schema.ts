import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export enum FitnessLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum FitnessGoal {
  WEIGHT_LOSS = 'weight_loss',
  MUSCLE_GAIN = 'muscle_gain',
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
  FLEXIBILITY = 'flexibility',
  GENERAL_FITNESS = 'general_fitness',
}

@Schema({ timestamps: true })
export class FitnessProfile extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({
    type: String,
    enum: Object.values(FitnessLevel),
    default: FitnessLevel.BEGINNER,
  })
  fitnessLevel: FitnessLevel;

  @Prop({
    type: [String],
    enum: Object.values(FitnessGoal),
    default: [FitnessGoal.GENERAL_FITNESS],
  })
  fitnessGoals: FitnessGoal[];

  @Prop({ type: [String], default: [] })
  preferredActivities: string[];

  @Prop({ type: Number })
  height?: number; // in cm

  @Prop({ type: Number })
  weight?: number; // in kg

  @Prop({ type: Number })
  targetWeight?: number; // in kg

  @Prop({ type: Boolean, default: false })
  hasInjuries: boolean;

  @Prop({ type: [String], default: [] })
  injuries: string[];

  @Prop({ type: Number, min: 1, max: 7, default: 3 })
  availableWorkoutDays: number;

  @Prop({ type: Number, min: 15, default: 45 })
  preferredWorkoutDuration: number; // in minutes

  @Prop({ type: Boolean, default: false })
  hasGymAccess: boolean;

  @Prop({ type: [String], default: [] })
  availableEquipment: string[];

  @Prop({ type: Number, min: 13, max: 120 })
  age?: number;

  @Prop({ type: String, enum: ['male', 'female', 'other'] })
  gender?: string;
}

export const FitnessProfileSchema =
  SchemaFactory.createForClass(FitnessProfile);
