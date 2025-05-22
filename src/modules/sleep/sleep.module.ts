import { Module } from '@nestjs/common';
import { SleepService } from './sleep.service';
import { SleepController } from './sleep.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { NotificationsModule } from '../Notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
  ],
  providers: [SleepService],
  controllers: [SleepController]
})
export class SleepModule {}
