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
exports.WorkoutsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const workouts_service_1 = require("../workouts/services/workouts.service");
const create_fitness_profile_dto_1 = require("../workouts/dto/create-fitness-profile.dto");
const generate_workout_plan_dto_1 = require("../workouts/dto/generate-workout-plan.dto");
let WorkoutsController = class WorkoutsController {
    constructor(workoutsService) {
        this.workoutsService = workoutsService;
    }
    async createOrUpdateFitnessProfile(req, createFitnessProfileDto) {
        return this.workoutsService.createOrUpdateFitnessProfile(req.user._id.toString(), createFitnessProfileDto);
    }
    async getFitnessProfile(req) {
        return this.workoutsService.getFitnessProfile(req.user._id.toString());
    }
    async generateWorkoutPlan(req, generateWorkoutPlanDto) {
        return this.workoutsService.generateWorkoutPlan(req.user._id.toString(), generateWorkoutPlanDto);
    }
    async getUserWorkoutPlans(req) {
        return this.workoutsService.getUserWorkoutPlans(req.user._id.toString());
    }
    async getWorkoutPlan(id) {
        return this.workoutsService.getWorkoutPlan(id);
    }
    async deleteWorkoutPlan(id) {
        await this.workoutsService.deleteWorkoutPlan(id);
        return { message: 'Workout plan deleted successfully' };
    }
    async rateWorkoutPlan(id, rating) {
        return this.workoutsService.rateWorkoutPlan(id, rating);
    }
    async trackWorkoutPlanUsage(id) {
        return this.workoutsService.trackWorkoutPlanUsage(id);
    }
    async getRecommendedWorkoutPlans(req) {
        return this.workoutsService.getRecommendedWorkoutPlans(req.user._id.toString());
    }
};
exports.WorkoutsController = WorkoutsController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create or update fitness profile' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'The fitness profile has been successfully created or updated.',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_fitness_profile_dto_1.CreateFitnessProfileDto]),
    __metadata("design:returntype", Promise)
], WorkoutsController.prototype, "createOrUpdateFitnessProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user fitness profile' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns the user fitness profile.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Fitness profile not found.',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkoutsController.prototype, "getFitnessProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a workout plan using AI' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'The workout plan has been successfully generated.',
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, generate_workout_plan_dto_1.GenerateWorkoutPlanDto]),
    __metadata("design:returntype", Promise)
], WorkoutsController.prototype, "generateWorkoutPlan", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all user workout plans' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns all workout plans for the user.',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkoutsController.prototype, "getUserWorkoutPlans", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('plans/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific workout plan' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns the specified workout plan.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Workout plan not found.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkoutsController.prototype, "getWorkoutPlan", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('plans/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a workout plan' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The workout plan has been successfully deleted.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Workout plan not found.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkoutsController.prototype, "deleteWorkoutPlan", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)('plans/:id/rate'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Rate a workout plan' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The workout plan has been successfully rated.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Workout plan not found.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('rating')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], WorkoutsController.prototype, "rateWorkoutPlan", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('plans/:id/track'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Track usage of a workout plan' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'The workout plan usage has been tracked.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'Workout plan not found.',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkoutsController.prototype, "trackWorkoutPlanUsage", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('recommended'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get recommended workout plans' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns recommended workout plans for the user.',
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkoutsController.prototype, "getRecommendedWorkoutPlans", null);
exports.WorkoutsController = WorkoutsController = __decorate([
    (0, swagger_1.ApiTags)('Workouts'),
    (0, common_1.Controller)('workouts'),
    __metadata("design:paramtypes", [workouts_service_1.WorkoutsService])
], WorkoutsController);
//# sourceMappingURL=workouts.controller.js.map