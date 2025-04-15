"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SleepModule = void 0;
const common_1 = require("@nestjs/common");
const sleep_service_1 = require("./sleep.service");
const sleep_controller_1 = require("./sleep.controller");
const mongoose_1 = require("@nestjs/mongoose");
const sleepLog_schema_1 = require("../../infrastructure/database/schemas/sleepLog.schema");
let SleepModule = class SleepModule {
};
exports.SleepModule = SleepModule;
exports.SleepModule = SleepModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: "Sleep", schema: sleepLog_schema_1.sleepLogSchema }]),
        ],
        providers: [sleep_service_1.SleepService],
        controllers: [sleep_controller_1.SleepController]
    })
], SleepModule);
//# sourceMappingURL=sleep.module.js.map