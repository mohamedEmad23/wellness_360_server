import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './services/workouts.service';
import { AiWorkoutService } from './services/ai-workout.service';
import { GeminiModule } from '../gemini/gemini.module';
import { DatabaseModule } from 'src/infrastructure/database/database.module';

@Module({
  imports: [
    GeminiModule,
    DatabaseModule,
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService, AiWorkoutService],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
