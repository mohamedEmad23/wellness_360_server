import { Module } from '@nestjs/common';
import { FitnessLogsController } from './fitness-logs.controller';
import { FitnessLogsService } from './fitness-logs.service';

@Module({
  controllers: [FitnessLogsController],
  providers: [FitnessLogsService]
})
export class FitnessLogsModule {}
