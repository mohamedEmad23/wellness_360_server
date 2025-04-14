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
exports.WorkoutsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const ai_workout_service_1 = require("./ai-workout.service");
const fitness_profile_schema_1 = require("../../../infrastructure/database/schemas/fitness-profile.schema");
const workout_plan_schema_1 = require("../../../infrastructure/database/schemas/workout-plan.schema");
let WorkoutsService = class WorkoutsService {
    constructor(fitnessProfileModel, workoutPlanModel, aiWorkoutService) {
        this.fitnessProfileModel = fitnessProfileModel;
        this.workoutPlanModel = workoutPlanModel;
        this.aiWorkoutService = aiWorkoutService;
    }
    async createOrUpdateFitnessProfile(userId, profileDto) {
        try {
            const existingProfile = await this.fitnessProfileModel.findOne({
                userId,
            });
            if (existingProfile) {
                Object.assign(existingProfile, profileDto);
                return await existingProfile.save();
            }
            else {
                const newProfile = new this.fitnessProfileModel({
                    userId,
                    ...profileDto,
                });
                return await newProfile.save();
            }
        }
        catch (error) {
            if (error instanceof mongoose_2.Error.ValidationError) {
                const errorMessages = Object.values(error.errors).map((err) => err.message);
                throw new common_1.BadRequestException({
                    message: 'Fitness profile validation failed',
                    errors: errorMessages,
                });
            }
            throw error;
        }
    }
    async getFitnessProfile(userId) {
        const profile = await this.fitnessProfileModel.findOne({ userId });
        if (!profile) {
            throw new common_1.NotFoundException('Fitness profile not found');
        }
        return profile;
    }
    async generateWorkoutPlan(userId, generateDto) {
        try {
            let fitnessProfile = null;
            try {
                fitnessProfile = await this.getFitnessProfile(userId);
            }
            catch (error) {
            }
            const workoutPlanData = await this.aiWorkoutService.generateWorkoutPlan(generateDto, fitnessProfile);
            const workoutPlan = new this.workoutPlanModel({
                ...workoutPlanData,
                userId,
            });
            return await workoutPlan.save();
        }
        catch (error) {
            if (error instanceof mongoose_2.Error.ValidationError) {
                const errorMessages = Object.values(error.errors).map((err) => err.message);
                throw new common_1.BadRequestException({
                    message: 'Workout plan validation failed',
                    errors: errorMessages,
                });
            }
            throw error;
        }
    }
    async getUserWorkoutPlans(userId) {
        return this.workoutPlanModel.find({ userId }).sort({ createdAt: -1 });
    }
    async getWorkoutPlan(workoutPlanId) {
        const workoutPlan = await this.workoutPlanModel.findById(workoutPlanId);
        if (!workoutPlan) {
            throw new common_1.NotFoundException('Workout plan not found');
        }
        return workoutPlan;
    }
    async rateWorkoutPlan(workoutPlanId, rating) {
        try {
            const workoutPlan = await this.getWorkoutPlan(workoutPlanId);
            workoutPlan.rating = rating;
            return await workoutPlan.save();
        }
        catch (error) {
            if (error instanceof mongoose_2.Error.ValidationError) {
                throw new common_1.BadRequestException('Invalid rating format');
            }
            throw error;
        }
    }
    async deleteWorkoutPlan(workoutPlanId) {
        const result = await this.workoutPlanModel.deleteOne({
            _id: workoutPlanId,
        });
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException('Workout plan not found');
        }
    }
    async trackWorkoutPlanUsage(workoutPlanId) {
        const workoutPlan = await this.getWorkoutPlan(workoutPlanId);
        workoutPlan.timesUsed += 1;
        return workoutPlan.save();
    }
    async getRecommendedWorkoutPlans(userId) {
        try {
            const profile = await this.getFitnessProfile(userId);
            const allWorkoutPlans = await this.workoutPlanModel
                .find({
                difficulty: profile.fitnessLevel,
            })
                .limit(5);
            return allWorkoutPlans;
        }
        catch (error) {
            return this.workoutPlanModel.find().sort({ rating: -1 }).limit(5);
        }
    }
};
exports.WorkoutsService = WorkoutsService;
exports.WorkoutsService = WorkoutsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(fitness_profile_schema_1.FitnessProfile.name)),
    __param(1, (0, mongoose_1.InjectModel)(workout_plan_schema_1.WorkoutPlan.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        ai_workout_service_1.AiWorkoutService])
], WorkoutsService);
//# sourceMappingURL=workouts.service.js.map