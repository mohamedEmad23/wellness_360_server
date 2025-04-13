"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActivityService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const userActivity_schema_1 = require("../../infrastructure/database/schemas/userActivity.schema");
const user_schema_1 = require("../../infrastructure/database/schemas/user.schema");
const activity_schema_1 = require("../../infrastructure/database/schemas/activity.schema");
let UserActivityService = class UserActivityService {
    constructor(userActivityModel, userModel, activityModel) {
        this.userActivityModel = userActivityModel;
        this.userModel = userModel;
        this.activityModel = activityModel;
    }
    async logActivity(dto, user_id) {
        const userId = new mongoose_2.Types.ObjectId(user_id);
        const activityId = new mongoose_2.Types.ObjectId(dto.activityId);
        const user = await this.userModel.findById(userId);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const activity = await this.activityModel.findById(activityId);
        if (!activity)
            throw new common_1.NotFoundException('Activity not found');
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
    async getUserActivities(userId) {
        const user_id = new mongoose_2.Types.ObjectId(userId);
        const activities = await this.userActivityModel
            .find({ user: user_id })
            .populate('activity', 'name met')
            .sort({ createdAt: -1 })
            .exec();
        return activities.map(a => {
            const populatedActivity = a.activity;
            return {
                activity: populatedActivity.name,
                duration: a.duration,
                title: a.title,
                caloriesBurned: Math.round(a.caloriesBurned),
                date: a.createdAt,
            };
        });
    }
    async deleteUserActivity(userActivityId) {
        const userActivity_id = new mongoose_2.Types.ObjectId(userActivityId);
        const activityEntry = await this.userActivityModel
            .findById(userActivity_id)
            .populate('activity')
            .populate('user');
        if (!activityEntry)
            throw new common_1.NotFoundException('Activity log not found');
        const user = activityEntry.user;
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
};
exports.UserActivityService = UserActivityService;
exports.UserActivityService = UserActivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(userActivity_schema_1.UserActivity.name)),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(2, (0, mongoose_1.InjectModel)(activity_schema_1.Activity.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], UserActivityService);
//# sourceMappingURL=userActivity.service.js.map