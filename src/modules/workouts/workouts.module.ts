import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './services/workouts.service';
import { AiWorkoutService } from './services/ai-workout.service';
import {
  FitnessProfile,
  FitnessProfileSchema,
} from '../../infrastructure/database/schemas/fitness-profile.schema';
import {
  WorkoutPlan,
  WorkoutPlanSchema,
} from '../../infrastructure/database/schemas/workout-plan.schema';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [
    GeminiModule,
    MongooseModule.forFeature([
      { name: FitnessProfile.name, schema: FitnessProfileSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
    ]),
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService, AiWorkoutService],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
