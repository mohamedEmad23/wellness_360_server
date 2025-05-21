import { Module } from '@nestjs/common';
import { DatabaseModels } from '../../infrastructure/database/database.models';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [DatabaseModels],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {} 