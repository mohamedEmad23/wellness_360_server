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

  async createFoodLog(foodLogs: CreateFoodLogDto[], userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();
    const user_id = new Types.ObjectId(userId);
    const user = await this.userModel.findById(user_id).session(session);
    try {
      for (const foodLog of foodLogs) {
        const logWithUser = {
            ...foodLog,
            userId: user_id,
          };

        await this.foodLogModel.create([logWithUser], { session });

        const caloriesLeft = user.caloriesLeft - foodLog.calories;
        await this.userModel.updateOne({ _id: user_id }, { caloriesLeft: caloriesLeft }).session(session);
      }
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getUserFoodLogs(userId: string) {
    return this.foodLogModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async getUserFoodLogsByDate(userId: string, date: Date) {
    return this.foodLogModel.find({ userId: new Types.ObjectId(userId), date: date }).exec();
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