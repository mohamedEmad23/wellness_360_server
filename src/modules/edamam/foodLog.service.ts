import { Injectable } from '@nestjs/common';
import { User } from '../../infrastructure/database/schemas/user.schema';
import { Model, Types, Connection } from 'mongoose';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { FoodLog } from 'src/infrastructure/database/schemas/foodLog.schema';
import { CreateFoodLogDto } from './dto/create-food-log.dto';
import { UserMacros } from 'src/infrastructure/database/schemas/userMacros.schema';
import { NutritionNotificationService } from '../Notifications/services/nutrition-notification.service';

@Injectable()
export class FoodLogService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(FoodLog.name) private foodLogModel: Model<FoodLog>,
    @InjectModel(UserMacros.name) private userMacrosModel: Model<UserMacros>,
    @InjectConnection() private connection: Connection,
    private readonly nutritionNotificationService: NutritionNotificationService,
  ) {}

  async createFoodLog(foodLog: CreateFoodLogDto, userId: string) {
    const user_id = new Types.ObjectId(userId);
    const userMacros = await this.userMacrosModel.findOne({ userId: user_id });

    
    const logWithUser = {
      ...foodLog,
      userId: user_id,
    };

    const createdLog = await this.foodLogModel.create([logWithUser]);

    const caloriesLeft = Math.max(0, userMacros.caloriesLeft - foodLog.calories);
    const proteinLeft = Math.max(0, userMacros.proteinLeft - foodLog.protein);
    const carbsLeft = Math.max(0, userMacros.carbsLeft - foodLog.carbs);
    const fatLeft = Math.max(0, userMacros.fatLeft - foodLog.fats);
    
    await this.userMacrosModel.updateOne({ _id: userMacros._id }, { 
      caloriesLeft, proteinLeft, carbsLeft, fatLeft 
    });

    // Check if this is a high-calorie meal (over 600 calories)
    if (foodLog.calories > 600) {
      await this.nutritionNotificationService.notifyHighCalorieMeal(
        userId,
        foodLog.foodName,
        foodLog.calories
      );
    }

    // Check if user has exceeded or is close to their daily calorie limit
    if (caloriesLeft <= 0) {
      await this.nutritionNotificationService.checkUserCalorieLimit(userId);
    }

    return createdLog[0];
  }

  async getUserFoodLogs(userId: string) {
    return this.foodLogModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async getUserFoodLogsByDate(userId: string, date: Date) {
    // Create a date object and work with local timezone consistently
    const dateObj = new Date(date);
    // Start of day in local timezone
    const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0);
    
    // End of day in local timezone (start of next day)
    const end = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1, 0, 0, 0);
    
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