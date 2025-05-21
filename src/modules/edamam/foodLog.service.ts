import { Injectable } from '@nestjs/common';
import { User } from '../../infrastructure/database/schemas/user.schema';
import { Model, Types, Connection } from 'mongoose';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { FoodLog } from 'src/infrastructure/database/schemas/foodLog.schema';
import { CreateFoodLogDto } from './dto/create-food-log.dto';
import { UserMacros } from 'src/infrastructure/database/schemas/userMacros.schema';

@Injectable()
export class FoodLogService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(FoodLog.name) private foodLogModel: Model<FoodLog>,
    @InjectModel(UserMacros.name) private userMacrosModel: Model<UserMacros>,
    @InjectConnection() private connection: Connection,
  ) {}

  async createFoodLog(foodLog: CreateFoodLogDto, userId: string) {
    const user_id = new Types.ObjectId(userId);
    const userMacros = await this.userMacrosModel.findOne({ userId: user_id });

    
    const logWithUser = {
      ...foodLog,
      userId: user_id,
    };

    await this.foodLogModel.create([logWithUser]);

    const caloriesLeft = Math.max(0, userMacros.caloriesLeft - foodLog.calories);
    const proteinLeft = Math.max(0, userMacros.proteinLeft - foodLog.protein);
    const carbsLeft = Math.max(0, userMacros.carbsLeft - foodLog.carbs);
    const fatLeft = Math.max(0, userMacros.fatLeft - foodLog.fats);
    
    await this.userMacrosModel.updateOne({ _id: userMacros._id }, { 
      caloriesLeft, proteinLeft, carbsLeft, fatLeft 
    });
  }

  async getUserFoodLogs(userId: string) {
    return this.foodLogModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async getUserFoodLogsByDate(userId: string, date: Date) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
  
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
  
    return this.foodLogModel.find({
      userId: new Types.ObjectId(userId),
      date: { $gte: start, $lt: end },
    }).exec();
  }
  

  async deleteUserFoodLog(userId: string, foodLogId: string) {
    const user_id = new Types.ObjectId(userId);
    const foodLog_id = new Types.ObjectId(foodLogId);

    const userMacros = await this.userMacrosModel.findOne({ userId: user_id }).exec();
    const foodLog = await this.foodLogModel.findById(foodLog_id).exec();

    if(foodLog.date.toDateString() === new Date().toDateString()) {
      const caloriesLeft = Math.min(userMacros.dailyCalories, userMacros.caloriesLeft + foodLog.calories);
      const proteinLeft = Math.min(userMacros.dailyProtein, userMacros.proteinLeft + foodLog.protein);
      const carbsLeft = Math.min(userMacros.dailyCarbs, userMacros.carbsLeft + foodLog.carbs);
      const fatLeft = Math.min(userMacros.dailyFat, userMacros.fatLeft + foodLog.fats);
      
      await this.userMacrosModel.updateOne({ _id: userMacros._id }, { 
        caloriesLeft, proteinLeft, carbsLeft, fatLeft 
      }).exec();
    }
    return this.foodLogModel.deleteOne({ _id: foodLog_id, userId: user_id }).exec();
  }
}