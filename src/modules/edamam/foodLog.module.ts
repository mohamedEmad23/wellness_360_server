import { Module } from '@nestjs/common';
import { FoodLogService } from './foodLog.service';
import { FoodLogController } from './foodLog.controller';
import { EdamamService } from './edamam.service';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { HttpModule } from '@nestjs/axios';
import { UserMacros, UserMacrosSchema } from 'src/infrastructure/database/schemas/userMacros.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsModule } from '../Notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule,
    HttpModule,
    MongooseModule.forFeature([{ name: UserMacros.name, schema: UserMacrosSchema }]),
    NotificationsModule,
  ],
  controllers: [FoodLogController],
  providers: [FoodLogService, EdamamService],
})
export class FoodLogModule {}


