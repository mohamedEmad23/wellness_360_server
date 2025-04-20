import { Injectable } from '@nestjs/common';
import { User } from '../../infrastructure/database/schemas/user.schema';
import { Model, Types, Connection } from 'mongoose';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { FoodLog } from 'src/infrastructure/database/schemas/foodLog.schema';
import { CreateFoodLogDto } from './dto/create-food-log.dto';

@Injectable()
export class FoodLogService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(FoodLog.name) private foodLogModel: Model<FoodLog>,
    @InjectConnection() private connection: Connection,
  ) {}

  async createFoodLog(foodLog: CreateFoodLogDto, userId: string) {
    const user_id = new Types.ObjectId(userId);
    const user = await this.userModel.findById(user_id);

    
    const logWithUser = {
      ...foodLog,
      userId: user_id,
    };

    await this.foodLogModel.create([logWithUser]);

    const caloriesLeft = user.caloriesLeft - foodLog.calories;
    await this.userModel.updateOne({ _id: user_id }, { caloriesLeft: caloriesLeft });
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

    const user = await this.userModel.findById(user_id).exec();
    const foodLog = await this.foodLogModel.findById(foodLog_id).exec();
    const caloriesLeft = user.caloriesLeft + foodLog.calories;

    await this.userModel.updateOne({ _id: user_id }, { caloriesLeft: caloriesLeft }).exec();
    return this.foodLogModel.deleteOne({ _id: foodLog_id, userId: user_id }).exec();
  }
}