import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsGateway } from './notification.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification, NotificationSchema } from '../../infrastructure/database/schemas/notification.schema';
import { WorkoutNotificationService } from './services/workout-notification.service';
import { SleepNotificationService } from './services/sleep-notification.service';
import { ActivityNotificationService } from './services/activity-notification.service';
import { NutritionNotificationService } from './services/nutrition-notification.service';
import { User, UserSchema } from '../../infrastructure/database/schemas/user.schema';
import { WorkoutPlan, WorkoutPlanSchema } from '../../infrastructure/database/schemas/workout-plan.schema';
import { SleepLog, SleepLogSchema } from '../../infrastructure/database/schemas/sleepLog.schema';
import { UserActivity, UserActivitySchema } from '../../infrastructure/database/schemas/userActivity.schema';
import { FoodLog, FoodLogSchema } from '../../infrastructure/database/schemas/foodLog.schema';
import { UserMacros, UserMacrosSchema } from '../../infrastructure/database/schemas/userMacros.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
      { name: SleepLog.name, schema: SleepLogSchema },
      { name: UserActivity.name, schema: UserActivitySchema },
      { name: FoodLog.name, schema: FoodLogSchema },
      { name: UserMacros.name, schema: UserMacrosSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService, 
    NotificationsGateway,
    WorkoutNotificationService,
    SleepNotificationService,
    ActivityNotificationService,
    NutritionNotificationService
  ],
  exports: [
    NotificationsService,
    WorkoutNotificationService,
    SleepNotificationService,
    ActivityNotificationService,
    NutritionNotificationService
  ],
})
export class NotificationsModule {}
