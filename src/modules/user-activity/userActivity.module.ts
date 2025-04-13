import { Module } from '@nestjs/common';
import { UserActivityService } from './userActivity.service';
import { UserActivityController } from './userActivity.controller';
import { MongooseModule } from '@nestjs/mongoose';

import { UserActivity, UserActivitySchema } from '../../infrastructure/database/schemas/userActivity.schema';
import { User, UserSchema } from '../../infrastructure/database/schemas/user.schema';
import { Activity, ActivitySchema } from '../../infrastructure/database/schemas/activity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserActivity.name, schema: UserActivitySchema },
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [UserActivityController],
  providers: [UserActivityService],
})
export class UserActivityModule {}