import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserMacros } from 'src/infrastructure/database/schemas/userMacros.schema';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(UserMacros.name) private readonly userMacrosModel: Model<UserMacros>
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyMacros() {
    try {
      const allMacros = await this.userMacrosModel.find().exec();
      
      for (const macros of allMacros) {
        await this.userMacrosModel.findByIdAndUpdate(
          macros._id,
          {
            caloriesLeft: macros.dailyCalories,
            proteinLeft: macros.dailyProtein,
            carbsLeft: macros.dailyCarbs,
            fatLeft: macros.dailyFat,
            date: new Date()
          }
        ).exec();
      }
    } catch (error) {
      console.error('Error resetting daily macros:', error);
    }
  }
} 