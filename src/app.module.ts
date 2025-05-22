import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { UserActivityModule } from './modules/user-activity/userActivity.module';
import { FoodLogModule } from './modules/edamam/foodLog.module';
import { SleepModule } from './modules/sleep/sleep.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationsModule } from './modules/Notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    UserActivityModule,
    FoodLogModule,
    WorkoutsModule,
    SleepModule,
    DashboardModule,
    ScheduleModule.forRoot(),
    NotificationsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
