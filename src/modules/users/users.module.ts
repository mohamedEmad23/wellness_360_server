import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduleService } from './schedule.service';
import { UsersController } from './users.controller';
import {
  User,
  UserSchema,
} from 'src/infrastructure/database/schemas/user.schema';
import { 
  UserMacros,
  UserMacrosSchema 
} from 'src/infrastructure/database/schemas/userMacros.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: UserMacros.name, schema: UserMacrosSchema }]),
    ScheduleModule.forRoot()
  ],
  controllers: [UsersController],
  providers: [UsersService, ScheduleService],
  exports: [UsersService],
})
export class UsersModule {}
