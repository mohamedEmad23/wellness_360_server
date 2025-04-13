"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModels = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("./schemas/user.schema");
const activity_schema_1 = require("./schemas/activity.schema");
const userActivity_schema_1 = require("./schemas/userActivity.schema");
let DatabaseModels = class DatabaseModels {
};
exports.DatabaseModels = DatabaseModels;
exports.DatabaseModels = DatabaseModels = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                { name: activity_schema_1.Activity.name, schema: activity_schema_1.ActivitySchema },
                { name: userActivity_schema_1.UserActivity.name, schema: userActivity_schema_1.UserActivitySchema },
            ]),
        ],
        exports: [
            mongoose_1.MongooseModule,
        ],
    })
], DatabaseModels);
//# sourceMappingURL=database.models.js.map