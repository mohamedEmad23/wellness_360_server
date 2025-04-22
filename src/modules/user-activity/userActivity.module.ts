import { Module } from '@nestjs/common';
import { UserActivityService } from './userActivity.service';
import { UserActivityController } from './userActivity.controller';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { UserMacros, UserMacrosSchema } from 'src/infrastructure/database/schemas/userMacros.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: UserMacros.name, schema: UserMacrosSchema }]),
  ],
  controllers: [UserActivityController],
  providers: [UserActivityService],
})
export class UserActivityModule {}