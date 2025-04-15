import { Module } from '@nestjs/common';
import { SleepService } from './sleep.service';
import { SleepController } from './sleep.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  sleepLogSchema,
} from 'src/infrastructure/database/schemas/sleepLog.schema';


@Module({
  imports: [
      MongooseModule.forFeature([{ name: "Sleep", schema: sleepLogSchema }]),
    ],
  providers: [SleepService],
  controllers: [SleepController]
})
export class SleepModule {}
