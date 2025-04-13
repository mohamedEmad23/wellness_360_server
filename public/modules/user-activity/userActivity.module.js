"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActivityModule = void 0;
const common_1 = require("@nestjs/common");
const userActivity_service_1 = require("./userActivity.service");
const userActivity_controller_1 = require("./userActivity.controller");
const mongoose_1 = require("@nestjs/mongoose");
const userActivity_schema_1 = require("../../infrastructure/database/schemas/userActivity.schema");
const user_schema_1 = require("../../infrastructure/database/schemas/user.schema");
const activity_schema_1 = require("../../infrastructure/database/schemas/activity.schema");
let UserActivityModule = class UserActivityModule {
};
exports.UserActivityModule = UserActivityModule;
exports.UserActivityModule = UserActivityModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: userActivity_schema_1.UserActivity.name, schema: userActivity_schema_1.UserActivitySchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: activity_schema_1.Activity.name, schema: activity_schema_1.ActivitySchema },
            ]),
        ],
        controllers: [userActivity_controller_1.UserActivityController],
        providers: [userActivity_service_1.UserActivityService],
    })
], UserActivityModule);
//# sourceMappingURL=userActivity.module.js.map