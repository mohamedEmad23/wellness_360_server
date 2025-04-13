import { UserActivityService } from './userActivity.service';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';
export declare class UserActivityController {
    private readonly userActivityService;
    constructor(userActivityService: UserActivityService);
    logActivity(userId: any, dto: CreateUserActivityDto): Promise<{
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
    deleteUserActivity(activityId: string, userId: string): Promise<{
        message: string;
        caloriesRemoved: number;
        updatedCaloriesLeft: number;
    }>;
}
