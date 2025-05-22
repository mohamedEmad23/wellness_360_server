import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserActivity, UserActivityDocument } from '../../infrastructure/database/schemas/userActivity.schema';
import { User } from '../../infrastructure/database/schemas/user.schema';
import { Activity } from '../../infrastructure/database/schemas/activity.schema';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';
import { UpdateUserActivityDto } from './dto/update-user-activity.dto';
import { UserMacros } from 'src/infrastructure/database/schemas/userMacros.schema';
import { ActivityNotificationService } from '../Notifications/services/activity-notification.service';

@Injectable()
export class UserActivityService {
  constructor(
    @InjectModel(UserActivity.name) private userActivityModel: Model<UserActivityDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    @InjectModel(UserMacros.name) private userMacrosModel: Model<UserMacros>,
    private readonly activityNotificationService: ActivityNotificationService,
  ) {}

  async logActivity(dto: CreateUserActivityDto, user_id: string) {
    const userId = new Types.ObjectId(user_id);
    const activityId = new Types.ObjectId(dto.activityId);

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const userMacros = await this.userMacrosModel.findOne({ userId: userId });
    if (!userMacros) throw new NotFoundException('User macros not found');

    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    const met = activity.met;
    const weight = user.weight;
    const durationInHours = dto.duration / 60;

    const caloriesBurned = met * weight * durationInHours;

    // Update userMacros values and ensure they don't exceed daily totals
    userMacros.caloriesLeft = Math.min(userMacros.dailyCalories, userMacros.caloriesLeft + caloriesBurned);
    
    // Convert calories to macronutrient grams using proper conversion factors
    const carbsCalories = caloriesBurned * 0.5;
    const proteinCalories = caloriesBurned * 0.25;
    const fatCalories = caloriesBurned * 0.25;
    
    userMacros.carbsLeft = Math.min(userMacros.dailyCarbs, userMacros.carbsLeft + (carbsCalories / 4));
    userMacros.proteinLeft = Math.min(userMacros.dailyProtein, userMacros.proteinLeft + (proteinCalories / 4));
    userMacros.fatLeft = Math.min(userMacros.dailyFat, userMacros.fatLeft + (fatCalories / 9));
    await userMacros.save();

    const userActivity = new this.userActivityModel({
      user: user._id,
      activity: activity._id,
      duration: dto.duration,
      title: dto.title,
      caloriesBurned,
      createdAt: dto.date ? new Date(dto.date) : new Date(),
    });

    await userActivity.save();

    // Send achievement notification for significant activities
    if (caloriesBurned > 300 || dto.duration >= 30) {
      const message = dto.duration >= 30 
        ? `completed a ${dto.duration}-minute ${activity.name} workout`
        : `burned ${Math.round(caloriesBurned)} calories with ${activity.name}`;
      
      await this.activityNotificationService.sendActivityAchievementNotification(
        user_id,
        message,
        {
          activityName: activity.name,
          duration: dto.duration,
          caloriesBurned: Math.round(caloriesBurned)
        }
      );
    }

    return {
      message: 'Activity logged successfully',
      data: {
        activityName: activity.name,
        duration: dto.duration,
        title: dto.title,
        caloriesBurned: Math.round(caloriesBurned),
        caloriesLeft: Math.round(userMacros.caloriesLeft),
      },
    };
  }

  async getUserActivities(userId: string) {
    const user_id = new Types.ObjectId(userId);

    const activities: UserActivityDocument[] = await this.userActivityModel
    .find({ user: user_id })
    .populate('activity', 'name met')
    .sort({ createdAt: -1 })
    .exec();

    return activities.map(a => {
      const populatedActivity = a.activity as Activity;

      return {
        _id: a._id,
        activity: populatedActivity.name,
        duration: a.duration,
        title: a.title,
        caloriesBurned: Math.round(a.caloriesBurned),
        date: a.createdAt,
      };
    });
  }

  async deleteUserActivity(userActivityId: string, userId: string) {
    const userActivity_id = new Types.ObjectId(userActivityId);
    const activityEntry = await this.userActivityModel
      .findOne({ _id: userActivity_id, user: userId })
      .populate('activity')
      .populate('user');
  
    if (!activityEntry) throw new NotFoundException('Activity log not found');
  
    const user = activityEntry.user as User & { _id: Types.ObjectId };
    const caloriesBurned = activityEntry.caloriesBurned ?? 0;

    const userMacros = await this.userMacrosModel.findOne({ userId: user._id });
    if (!userMacros) throw new NotFoundException('User macros not found');
  
    // Update userMacros values and ensure they don't go below zero
    userMacros.caloriesLeft = Math.max(0, userMacros.caloriesLeft - caloriesBurned);
    
    // Convert calories to macronutrient grams using proper conversion factors
    const carbsCalories = caloriesBurned * 0.5;
    const proteinCalories = caloriesBurned * 0.25;
    const fatCalories = caloriesBurned * 0.25;
    
    userMacros.carbsLeft = Math.max(0, userMacros.carbsLeft - (carbsCalories / 4));
    userMacros.proteinLeft = Math.max(0, userMacros.proteinLeft - (proteinCalories / 4));
    userMacros.fatLeft = Math.max(0, userMacros.fatLeft - (fatCalories / 9));
    await userMacros.save();
  
    await this.userActivityModel.findByIdAndDelete(userActivityId);
  
    return {
      message: 'Activity log deleted',
      caloriesRemoved: Math.round(caloriesBurned),
      updatedCaloriesLeft: Math.round(userMacros.caloriesLeft),
    };
  }

  async getAllActivities() {
    const activities = await this.activityModel.find().exec();
    return activities.map(activity => ({
      id: activity._id,
      name: activity.name,
      met: activity.met,
    }));
  }

  async updateActivity(userId: string, activityId: string, dto: UpdateUserActivityDto) {
    const user_id = new Types.ObjectId(userId);
    const activity_id = new Types.ObjectId(activityId);

    const activityEntry = await this.userActivityModel
      .findOne({ _id: activity_id, user: user_id })
      .populate('activity')
      .populate('user');

    if (!activityEntry) {
      throw new NotFoundException('Activity not found');
    }

    const user = activityEntry.user as User & { _id: Types.ObjectId };
    const oldCaloriesBurned = activityEntry.caloriesBurned ?? 0;

    // If duration or activity type is being updated, recalculate calories burned
    if (dto.duration || dto.activityId) {
      const activity = await this.activityModel.findById(
        dto.activityId ? new Types.ObjectId(dto.activityId) : activityEntry.activity
      );
      if (!activity) {
        throw new NotFoundException('Activity type not found');
      }

      const met = activity.met;
      const weight = user.weight;
      const durationInHours = (dto.duration || activityEntry.duration) / 60;
      const newCaloriesBurned = met * weight * durationInHours;

      // Update user macros with the difference in calories
      const userMacros = await this.userMacrosModel.findOne({ userId: user._id });
      if (!userMacros) {
        throw new NotFoundException('User macros not found');
      }

      const caloriesDifference = newCaloriesBurned - oldCaloriesBurned;
      userMacros.caloriesLeft = Math.max(0, userMacros.caloriesLeft + caloriesDifference);
      
      // Convert calories to macronutrient grams using proper conversion factors
      const carbsCalories = caloriesDifference * 0.5;
      const proteinCalories = caloriesDifference * 0.25;
      const fatCalories = caloriesDifference * 0.25;
      
      userMacros.carbsLeft = Math.max(0, userMacros.carbsLeft + (carbsCalories / 4));
      userMacros.proteinLeft = Math.max(0, userMacros.proteinLeft + (proteinCalories / 4));
      userMacros.fatLeft = Math.max(0, userMacros.fatLeft + (fatCalories / 9));
      await userMacros.save();

      // Update the activity
      const updatedActivity = await this.userActivityModel.findByIdAndUpdate(
        activity_id,
        {
          activity: dto.activityId ? new Types.ObjectId(dto.activityId) : activityEntry.activity,
          duration: dto.duration || activityEntry.duration,
          title: dto.title || activityEntry.title,
          caloriesBurned: newCaloriesBurned,
          createdAt: dto.date ? new Date(dto.date) : activityEntry.createdAt,
        },
        { new: true, timestamps: false }
      ).populate('activity', 'name met');

      return {
        message: 'Activity updated successfully',
        data: {
          activityName: (updatedActivity.activity as Activity).name,
          duration: updatedActivity.duration,
          title: updatedActivity.title,
          caloriesBurned: Math.round(updatedActivity.caloriesBurned),
          date: updatedActivity.createdAt,
        },
      };
    }

    // If only updating title or date
    const updatedActivity = await this.userActivityModel.findByIdAndUpdate(
      activity_id,
      {
        title: dto.title || activityEntry.title,
        createdAt: dto.date ? new Date(dto.date) : activityEntry.createdAt,
      },
      { new: true, timestamps: false }
    ).populate('activity', 'name met');

    return {
      message: 'Activity updated successfully',
      data: {
        activityName: (updatedActivity.activity as Activity).name,
        duration: updatedActivity.duration,
        title: updatedActivity.title,
        caloriesBurned: Math.round(updatedActivity.caloriesBurned),
        date: updatedActivity.createdAt,
      },
    };
  }
}
