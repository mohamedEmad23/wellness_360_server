import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './services/workouts.service';
import { AiWorkoutService } from './services/ai-workout.service';
import { CaloriesService } from './services/calories.service';
import { CaloriesTrackingService } from './services/calories-tracking.service';
import { ActivityTrackingService } from './services/activity-tracking.service';
import { GeminiModule } from '../gemini/gemini.module';
import { FitnessProfile, FitnessProfileSchema } from '../../infrastructure/database/schemas/fitness-profile.schema';
import { WorkoutPlan, WorkoutPlanSchema } from '../../infrastructure/database/schemas/workout-plan.schema';
import { SleepLog, SleepLogSchema } from '../../infrastructure/database/schemas/sleepLog.schema';
import { FoodLog, FoodLogSchema } from '../../infrastructure/database/schemas/foodLog.schema';
import { UserActivity, UserActivitySchema } from '../../infrastructure/database/schemas/userActivity.schema';
import { Activity, ActivitySchema } from '../../infrastructure/database/schemas/activity.schema';
import { User, UserSchema } from '../../infrastructure/database/schemas/user.schema';
import { UserCaloriesBurned, UserCaloriesBurnedSchema } from '../../infrastructure/database/schemas/userCaloriesBurned.schema';
import { NotificationsModule } from '../Notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FitnessProfile.name, schema: FitnessProfileSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
      { name: SleepLog.name, schema: SleepLogSchema },
      { name: FoodLog.name, schema: FoodLogSchema },
      { name: UserActivity.name, schema: UserActivitySchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: User.name, schema: UserSchema },
      { name: UserCaloriesBurned.name, schema: UserCaloriesBurnedSchema },
    ]),
    GeminiModule,
    NotificationsModule,
  ],
  controllers: [WorkoutsController],
  providers: [
    WorkoutsService, 
    AiWorkoutService, 
    CaloriesService, 
    CaloriesTrackingService,
    ActivityTrackingService
  ],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
