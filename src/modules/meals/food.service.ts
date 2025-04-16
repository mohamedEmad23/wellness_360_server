import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Food, FoodDocument } from '../../infrastructure/database/schemas/food.schema';
import { User, UserDocument } from '../../infrastructure/database/schemas/user.schema';
import { FoodLog, FoodLogDocument } from '../../infrastructure/database/schemas/foodLog';
import { CreateFoodDto } from './dto/create-food.dto';

@Injectable()
export class FoodService {
  constructor(
    @InjectModel(Food.name) private foodModel: Model<FoodDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(FoodLog.name) private foodLogModel: Model<FoodLogDocument>,
  ) {}

  async createFood(dto: CreateFoodDto, user_id: string) {
    const userId = new Types.ObjectId(user_id);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const food = new this.foodModel({ ...dto, createdBy: user._id });
    await food.save();

    return { message: 'Food item created successfully', data: food };
  }

  async getUserFoods(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    return await this.foodModel.find({ createdBy: user._id }).exec();
  }

  async getFoodById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Invalid food ID');
    const food = await this.foodModel.findById(id);
    if (!food) throw new NotFoundException('Food item not found');
    return food;
  }

  async updateFood(id: string, dto: CreateFoodDto) {
    const food = await this.foodModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!food) throw new NotFoundException('Food item not found');
    return food;
  }

  async deleteFood(id: string) {
    const food = await this.foodModel.findByIdAndDelete(id).exec();
    if (!food) throw new NotFoundException('Food item not found');
    return { message: 'Food item deleted successfully' };
  }

  async eatByName(user_id: string, foodName: string) {
    const user = await this.userModel.findById(user_id);
    if (!user) throw new NotFoundException('User not found');

    const food = await this.foodModel.findOne({ name: foodName });
    if (!food) throw new NotFoundException('Food item not found with that name');

    user.caloriesLeft = (user.caloriesLeft ?? user.dailyCalories) - food.calories;
    if (user.caloriesLeft < 0) user.caloriesLeft = 0;
    await user.save();

    const log = await this.foodLogModel.findOne({ user: user._id });
    if (log) {
      log.entries.push({ food: food, quantity: 1, eatenAt: new Date() });
      await log.save();
    } else {
      await this.foodLogModel.create({
        user: user._id,
        entries: [{ food: food, quantity: 1, eatenAt: new Date() }],
      });
    }

    return {
      message: 'Food consumed successfully',
      data: {
        foodName: food.name,
        caloriesConsumed: food.calories,
        updatedCaloriesLeft: Math.round(user.caloriesLeft),
      },
    };
  }

  async getTodayCalories(user_id: string) {
    const userId = new Types.ObjectId(user_id);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    
    const caloriesLeft = user.caloriesLeft ?? user.dailyCalories;
    const totalCaloriesConsumed = user.dailyCalories - caloriesLeft;
    
    return {
      dailyCalories: user.dailyCalories,
      caloriesLeft: Math.round(caloriesLeft),
      caloriesConsumed: Math.round(totalCaloriesConsumed)
    };
  }

  async resetCalories(user_id: string) {
    const userId = new Types.ObjectId(user_id);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    user.caloriesLeft = user.dailyCalories;
    await user.save();

    return { message: 'Calories reset for the day.' };
  }

  async logMeal(user_id: string, foodName: string, date = new Date(), quantity = 1) {
    const userId = new Types.ObjectId(user_id);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
  
    const food = await this.foodModel.findOne({ name: foodName });
    if (!food) throw new NotFoundException('Food not found');
  
    const totalCalories = food.calories * quantity;
    user.caloriesLeft = (user.caloriesLeft ?? user.dailyCalories) - totalCalories;
    if (user.caloriesLeft < 0) user.caloriesLeft = 0;
    await user.save();
  
    const log = await this.foodLogModel.findOne({ user: user._id });
  
    const newEntry = {
      food: food,
      quantity,
      eatenAt: date,
    };
  
    if (log) {
      log.entries.push(newEntry);
      await log.save();
    } else {
      await this.foodLogModel.create({
        user: user._id,
        entries: [newEntry],
      });
    }
  
    return {
      message: 'Meal logged successfully',
      food: food.name,
      quantity,
      date,
      caloriesSubtracted: totalCalories,
      caloriesLeft: user.caloriesLeft,
    };
  }

  async getFoodsByType(type: string) {
    const validTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'cheat meal'];
    if (!validTypes.includes(type)) throw new NotFoundException('Invalid food type');
    return await this.foodModel.find({ type }).exec();
  }

  async getAllFoods() {
    return await this.foodModel.find().exec();
  }

  async getFoodLog(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const log = await this.foodLogModel
      .findOne({ user: user._id })
      .populate('entries.food')
      .exec();

    if (!log || log.entries.length === 0) {
      return { message: 'No food logs found for this user.', history: [] };
    }

    const history = log.entries.map(entry => ({
      foodName: entry.food.name,
      calories: entry.food.calories,
      quantity: entry.quantity,
      eatenAt: entry.eatenAt,
    }));

    return { message: 'Food log history fetched successfully', history };
  }
}