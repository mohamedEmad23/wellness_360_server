import { Module } from '@nestjs/common';
import { UserActivityService } from './userActivity.service';
import { UserActivityController } from './userActivity.controller';
import { DatabaseModule } from 'src/infrastructure/database/database.module';

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [UserActivityController],
  providers: [UserActivityService, ],
})
export class UserActivityModule {}