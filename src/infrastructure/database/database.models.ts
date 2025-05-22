import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { UserActivity, UserActivitySchema } from './schemas/userActivity.schema';
import { FitnessProfile, FitnessProfileSchema } from './schemas/fitness-profile.schema';
import { WorkoutPlan, WorkoutPlanSchema } from './schemas/workout-plan.schema';
import { FoodLog, FoodLogSchema } from './schemas/foodLog.schema';
import { SleepLog, SleepLogSchema } from './schemas/sleepLog.schema';
import { ReauthSession, ReauthSessionSchema } from './schemas/reauth-session.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: UserActivity.name, schema: UserActivitySchema },
      { name: FitnessProfile.name, schema: FitnessProfileSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },    
      { name: FoodLog.name, schema: FoodLogSchema },
      { name: SleepLog.name, schema: SleepLogSchema },
      { name: ReauthSession.name, schema: ReauthSessionSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  exports: [
    MongooseModule,
  ],
})
export class DatabaseModels {}
