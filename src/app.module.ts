import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WorkoutsModule } from './modules/workouts/workouts.module';
import { UserActivityModule } from './modules/user-activity/userActivity.module';
import { SleepModule } from './modules/sleep/sleep.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    UserActivityModule,
    WorkoutsModule,
    SleepModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
