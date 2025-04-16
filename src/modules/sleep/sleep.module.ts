import { Module } from '@nestjs/common';
import { SleepService } from './sleep.service';
import { SleepController } from './sleep.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from 'src/infrastructure/database/database.module';


@Module({
  imports: [
    DatabaseModule,
  ],
  providers: [SleepService],
  controllers: [SleepController]
})
export class SleepModule {}
