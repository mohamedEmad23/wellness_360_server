import { Model } from 'mongoose';
import { UserActivityDocument } from '../../infrastructure/database/schemas/userActivity.schema';
import { User } from '../../infrastructure/database/schemas/user.schema';
import { Activity } from '../../infrastructure/database/schemas/activity.schema';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';
export declare class UserActivityService {
    private userActivityModel;
    private userModel;
    private activityModel;
    constructor(userActivityModel: Model<UserActivityDocument>, userModel: Model<User>, activityModel: Model<Activity>);
    logActivity(dto: CreateUserActivityDto, user_id: string): Promise<{
        message: string;
        data: {
            activityName: string;
            duration: number;
            title: string;
            caloriesBurned: number;
            caloriesLeft: number;
        };
    }>;
    getUserActivities(userId: string): Promise<{
        activity: string;
        duration: number;
        title: string;
        caloriesBurned: number;
        date: Date;
    }[]>;
    deleteUserActivity(userActivityId: string): Promise<{
        message: string;
        caloriesRemoved: number;
        updatedCaloriesLeft: number;
    }>;
}
