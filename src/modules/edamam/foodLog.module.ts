import { Module } from '@nestjs/common';
import { FoodLogService } from './foodLog.service';
import { FoodLogController } from './foodLog.controller';
import { EdamamService } from './edamam.service';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [FoodLogController],
  providers: [FoodLogService, EdamamService],
})
export class FoodLogModule {}


