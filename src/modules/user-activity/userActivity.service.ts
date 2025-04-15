import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UserActivity, UserActivityDocument } from '../../infrastructure/database/schemas/userActivity.schema';
import { User } from '../../infrastructure/database/schemas/user.schema';
import { Activity } from '../../infrastructure/database/schemas/activity.schema';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';

@Injectable()
export class UserActivityService {
  constructor(
    @InjectModel(UserActivity.name) private userActivityModel: Model<UserActivityDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
  ) {}

  async logActivity(dto: CreateUserActivityDto, user_id: string) {
    const userId = new Types.ObjectId(user_id);
    const activityId = new Types.ObjectId(dto.activityId);

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const activity = await this.activityModel.findById(activityId);
    if (!activity) throw new NotFoundException('Activity not found');

    const met = activity.met;
    const weight = user.weight;
    const durationInHours = dto.duration / 60;

    const caloriesBurned = met * weight * durationInHours;

    user.caloriesLeft = (user.caloriesLeft ?? user.dailyCalories) + caloriesBurned;
    await user.save();

    const userActivity = new this.userActivityModel({
      user: user._id,
      activity: activity._id,
      duration: dto.duration,
      title: dto.title,
      caloriesBurned,
    });

    await userActivity.save();

    return {
      message: 'Activity logged successfully',
      data: {
        activityName: activity.name,
        duration: dto.duration,
        title: dto.title,
        caloriesBurned: Math.round(caloriesBurned),
        caloriesLeft: Math.round(user.caloriesLeft),
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
  
    user.caloriesLeft -= caloriesBurned;
    await this.userModel.findByIdAndUpdate(user._id, { caloriesLeft: user.caloriesLeft });
  
    await this.userActivityModel.findByIdAndDelete(userActivityId);
  
    return {
      message: 'Activity log deleted',
      caloriesRemoved: Math.round(caloriesBurned),
      updatedCaloriesLeft: Math.round(user.caloriesLeft),
    };
  }
}
