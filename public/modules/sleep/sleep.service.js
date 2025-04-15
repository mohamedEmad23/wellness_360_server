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
exports.SleepService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let SleepService = class SleepService {
    constructor(sleepLogModel) {
        this.sleepLogModel = sleepLogModel;
    }
    async create(id, data) {
        const log = new this.sleepLogModel(data);
        let duration = log.endTime.getTime() - log.startTime.getTime();
        duration = duration / (1000 * 60 * 60);
        log.Duration = duration;
        log.userID = id;
        return await log.save();
    }
    async update(id, userID, updateData) {
        const log = await await this.sleepLogModel.findById(id);
        if (!log) {
            throw new common_1.NotFoundException(`Sleep log with specified ID not found`);
        }
        if (String(log.userID) != userID) {
            throw new common_1.ForbiddenException(`Sleep Log does not belong to user`);
        }
        const result = await this.sleepLogModel.updateOne({ _id: id }, updateData);
        return `Sleep Log with ID:${id} Successfully Updated`;
    }
    async delete(id, userID) {
        const log = await this.sleepLogModel.findById(id);
        if (!log) {
            throw new common_1.NotFoundException(`Sleep log with specified ID not found`);
        }
        if (String(log.userID) != userID) {
            throw new common_1.ForbiddenException(`Sleep Log does not belong to user`);
        }
        const result = await this.sleepLogModel.deleteOne({ _id: id });
        return `Sleep Log with ID:${id} Successfully Deleted`;
    }
    async getLogs(id) {
        const logs = await this.sleepLogModel.find({ userID: id });
        return logs;
    }
    async avgDuration(id) {
        const avgSleep = await this.sleepLogModel.aggregate([
            {
                $group: {
                    _id: id,
                    avgDuration: { $avg: "$Duration" }
                }
            }
        ]);
        let res = "";
        const hours = avgSleep[0].avgDuration;
        return { "avg_duration": hours };
    }
    async avgRating(id) {
        const avgRating = await this.sleepLogModel.aggregate([
            {
                $group: {
                    _id: id,
                    avgRating: { $avg: "$Rating" }
                }
            }
        ]);
        const rating = avgRating[0].avgRating;
        return { "avg_rating": rating };
    }
};
exports.SleepService = SleepService;
exports.SleepService = SleepService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)('Sleep')),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SleepService);
//# sourceMappingURL=sleep.service.js.map