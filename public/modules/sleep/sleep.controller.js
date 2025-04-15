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
exports.SleepController = void 0;
const common_1 = require("@nestjs/common");
const sleep_service_1 = require("./sleep.service");
const create_sleepLog_dto_1 = require("../sleep/dto/create-sleepLog.dto");
const update_sleepLog_dto_1 = require("../sleep/dto/update-sleepLog.dto");
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let SleepController = class SleepController {
    constructor(sleepService) {
        this.sleepService = sleepService;
    }
    getAVGtime(req) {
        return this.sleepService.avgDuration(req.user._id);
    }
    getAVGrating(req) {
        return this.sleepService.avgRating(req.user._id);
    }
    getLogs(req) {
        return this.sleepService.getLogs(req.user._id);
    }
    addLog(req, data) {
        return this.sleepService.create(req.user._id, data);
    }
    deleteLog(req, id) {
        return this.sleepService.delete(id, req.user._id);
    }
    updateLog(req, id, updateData) {
        return this.sleepService.update(id, req.user._id, updateData);
    }
};
exports.SleepController = SleepController;
__decorate([
    (0, common_1.Get)("avgDuration"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Average Sleep Duration',
        description: 'Retrieves the average sleep duration for the authenticated user'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Average sleep duration retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                avgDuration: { type: 'number', example: 7.5, description: 'Average sleep duration in hours' }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Unauthorized: JWT token is missing or invalid' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SleepController.prototype, "getAVGtime", null);
__decorate([
    (0, common_1.Get)("avgRating"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Average Sleep Rating',
        description: 'Retrieves the average sleep quality rating for the authenticated user'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Average sleep rating retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                avgRating: { type: 'number', example: 4.2, description: 'Average sleep quality rating on a scale of 1-5' }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Unauthorized: JWT token is missing or invalid' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SleepController.prototype, "getAVGrating", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Sleep Logs',
        description: 'Retrieves all sleep logs for the authenticated user'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Sleep logs retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    _id: { type: 'string', example: '60d9f3a94f9a8d26f45b5e3c' },
                    userId: { type: 'string', example: '60d9f3a94f9a8d26f45b5e3d' },
                    startTime: { type: 'string', format: 'date-time' },
                    endTime: { type: 'string', format: 'date-time' },
                    duration: { type: 'number', example: 8.5 },
                    quality: { type: 'number', example: 4 },
                    notes: { type: 'string', example: 'Slept well, but woke up once' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' }
                }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Unauthorized: JWT token is missing or invalid' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SleepController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Post)("add"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Add Sleep Log',
        description: 'Creates a new sleep log for the authenticated user'
    }),
    (0, swagger_1.ApiBody)({
        type: create_sleepLog_dto_1.createSleepLogDTO,
        description: 'Sleep log data',
        examples: {
            example1: {
                value: {
                    startTime: '2025-04-13T22:00:00Z',
                    endTime: '2025-04-14T06:30:00Z',
                    quality: 4,
                    notes: 'Good sleep, woke up refreshed'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Sleep log created successfully',
        schema: {
            type: 'object',
            properties: {
                _id: { type: 'string', example: '60d9f3a94f9a8d26f45b5e3c' },
                userId: { type: 'string', example: '60d9f3a94f9a8d26f45b5e3d' },
                startTime: { type: 'string', format: 'date-time' },
                endTime: { type: 'string', format: 'date-time' },
                duration: { type: 'number', example: 8.5 },
                quality: { type: 'number', example: 4 },
                notes: { type: 'string', example: 'Good sleep, woke up refreshed' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Unauthorized: JWT token is missing or invalid' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_sleepLog_dto_1.createSleepLogDTO]),
    __metadata("design:returntype", void 0)
], SleepController.prototype, "addLog", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete Sleep Log',
        description: 'Deletes a specific sleep log by ID'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: 'string',
        description: 'The MongoDB ObjectId of the sleep log to delete',
        example: '60d9f3a94f9a8d26f45b5e3c'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Sleep Log with ID:60d9f3a94f9a8d26f45b5e3c Successfully Deleted',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                message: { type: 'string', example: 'Sleep log deleted successfully' }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Unauthorized: JWT token is missing or invalid' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Sleep Log does not belong to user' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Sleep log with specified ID not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', new mongoose_2.ParseObjectIdPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mongoose_1.Types.ObjectId]),
    __metadata("design:returntype", void 0)
], SleepController.prototype, "deleteLog", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: 'Update Sleep Log',
        description: 'Updates a specific sleep log by ID'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        type: 'string',
        description: 'The MongoDB ObjectId of the sleep log to update',
        example: '60d9f3a94f9a8d26f45b5e3c'
    }),
    (0, swagger_1.ApiBody)({
        type: update_sleepLog_dto_1.updateSleepLogDTO,
        description: 'Updated sleep log data',
        examples: {
            example1: {
                value: {
                    quality: 5,
                    notes: 'Updated: Great sleep, felt very refreshed'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Sleep log successfully updated',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Sleep Log with ID:60d9f3a94f9a8d26f45b5e3c successfully updated',
                }
            }
        }
    }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Unauthorized: JWT token is missing or invalid' }),
    (0, swagger_1.ApiForbiddenResponse)({ description: 'Sleep Log does not belong to user' }),
    (0, swagger_1.ApiNotFoundResponse)({ description: 'Sleep log with specified ID not found' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', new mongoose_2.ParseObjectIdPipe())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, mongoose_1.Types.ObjectId, update_sleepLog_dto_1.updateSleepLogDTO]),
    __metadata("design:returntype", void 0)
], SleepController.prototype, "updateLog", null);
exports.SleepController = SleepController = __decorate([
    (0, swagger_1.ApiTags)('Sleep Tracking'),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Controller)('sleep'),
    __metadata("design:paramtypes", [sleep_service_1.SleepService])
], SleepController);
//# sourceMappingURL=sleep.controller.js.map