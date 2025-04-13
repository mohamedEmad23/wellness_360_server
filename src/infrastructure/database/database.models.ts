import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas/user.schema';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { UserActivity, UserActivitySchema } from './schemas/userActivity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
      { name: UserActivity.name, schema: UserActivitySchema },
    ]),
  ],
  exports: [
    MongooseModule,
  ],
})
export class DatabaseModels {}
