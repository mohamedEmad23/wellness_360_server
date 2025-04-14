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
        try {
            return this.workoutsService.createOrUpdateFitnessProfile(req.user._id.toString(), createFitnessProfileDto);
        }
        catch (error) {
            if (error.name === 'BadRequestException' || error.status === 400) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((err) => err.message);
                throw new common_1.HttpException({ message: 'Validation failed', errors: messages }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (error.name === 'MongoServerError' && error.code === 121) {
                throw new common_1.HttpException('Invalid value provided for fitness level or fitness goals. Please use only valid values.', common_1.HttpStatus.BAD_REQUEST);
            }
            throw new common_1.HttpException(`Failed to create fitness profile: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getFitnessProfile(req) {
        try {
            return this.workoutsService.getFitnessProfile(req.user._id.toString());
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(`Failed to retrieve fitness profile: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generateWorkoutPlan(req, generateWorkoutPlanDto) {
        try {
            return this.workoutsService.generateWorkoutPlan(req.user._id.toString(), generateWorkoutPlanDto);
        }
        catch (error) {
            if (error.name === 'BadRequestException' || error.status === 400) {
                throw error;
            }
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map((err) => err.message);
                throw new common_1.HttpException({ message: 'Validation failed', errors: messages }, common_1.HttpStatus.BAD_REQUEST);
            }
            if (error.name === 'MongoServerError' && error.code === 121) {
                throw new common_1.HttpException('Invalid value provided for workout type or difficulty. Please use only valid values.', common_1.HttpStatus.BAD_REQUEST);
            }
            if (error.message?.includes('Failed to generate') ||
                error.message?.includes('parsing')) {
                throw new common_1.HttpException('Error generating workout plan. Please try again later.', common_1.HttpStatus.SERVICE_UNAVAILABLE);
            }
            throw new common_1.HttpException(`Failed to generate workout plan: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserWorkoutPlans(req) {
        try {
            return this.workoutsService.getUserWorkoutPlans(req.user._id.toString());
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to retrieve workout plans: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getWorkoutPlan(id) {
        try {
            return this.workoutsService.getWorkoutPlan(id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(`Failed to retrieve workout plan: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteWorkoutPlan(id) {
        try {
            await this.workoutsService.deleteWorkoutPlan(id);
            return { message: 'Workout plan deleted successfully' };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(`Failed to delete workout plan: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async rateWorkoutPlan(id, rating) {
        try {
            if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
                throw new common_1.HttpException('Rating must be an integer between 1 and 5', common_1.HttpStatus.BAD_REQUEST);
            }
            return this.workoutsService.rateWorkoutPlan(id, rating);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(`Failed to rate workout plan: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async trackWorkoutPlanUsage(id) {
        try {
            return this.workoutsService.trackWorkoutPlanUsage(id);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(`Failed to track workout plan usage: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRecommendedWorkoutPlans(req) {
        try {
            return this.workoutsService.getRecommendedWorkoutPlans(req.user._id.toString());
        }
        catch (error) {
            throw new common_1.HttpException(`Failed to get recommended workout plans: ${error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
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
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input data.',
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
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Invalid input data.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 500,
        description: 'Error generating workout plan.',
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