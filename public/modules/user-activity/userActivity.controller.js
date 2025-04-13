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
exports.UserActivityController = void 0;
const common_1 = require("@nestjs/common");
const userActivity_service_1 = require("./userActivity.service");
const create_user_activity_dto_1 = require("./dto/create-user-activity.dto");
const swagger_1 = require("@nestjs/swagger");
const getUser_decorator_1 = require("../../common/decorators/getUser.decorator");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let UserActivityController = class UserActivityController {
    constructor(userActivityService) {
        this.userActivityService = userActivityService;
    }
    async logActivity(userId, dto) {
        return this.userActivityService.logActivity(dto, userId);
    }
    async getUserActivities(userId) {
        return this.userActivityService.getUserActivities(userId);
    }
    async deleteUserActivity(activityId, userId) {
        return this.userActivityService.deleteUserActivity(activityId);
    }
};
exports.UserActivityController = UserActivityController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Log an activity for a user' }),
    (0, swagger_1.ApiBody)({ type: create_user_activity_dto_1.CreateUserActivityDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Activity logged successfully' }),
    __param(0, (0, getUser_decorator_1.GetUser)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_user_activity_dto_1.CreateUserActivityDto]),
    __metadata("design:returntype", Promise)
], UserActivityController.prototype, "logActivity", null);
__decorate([
    (0, common_1.Get)(':userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all activities logged by a user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns the list of user activities' }),
    __param(0, (0, getUser_decorator_1.GetUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserActivityController.prototype, "getUserActivities", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a specific user activity' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'The ID of the user activity to delete' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Activity deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, getUser_decorator_1.GetUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserActivityController.prototype, "deleteUserActivity", null);
exports.UserActivityController = UserActivityController = __decorate([
    (0, swagger_1.ApiTags)('User Activity'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('user-activity'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [userActivity_service_1.UserActivityService])
], UserActivityController);
//# sourceMappingURL=userActivity.controller.js.map