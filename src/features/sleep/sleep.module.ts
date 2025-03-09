import { Module } from '@nestjs/common';
import { SleepController } from './sleep.controller';
import { SleepService } from './sleep.service';

@Module({
  controllers: [SleepController],
  providers: [SleepService]
})
export class SleepModule {}
