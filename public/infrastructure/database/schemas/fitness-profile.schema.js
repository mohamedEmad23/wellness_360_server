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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FitnessProfileSchema = exports.FitnessProfile = exports.FitnessGoal = exports.FitnessLevel = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./user.schema");
var FitnessLevel;
(function (FitnessLevel) {
    FitnessLevel["BEGINNER"] = "beginner";
    FitnessLevel["INTERMEDIATE"] = "intermediate";
    FitnessLevel["ADVANCED"] = "advanced";
})(FitnessLevel || (exports.FitnessLevel = FitnessLevel = {}));
var FitnessGoal;
(function (FitnessGoal) {
    FitnessGoal["WEIGHT_LOSS"] = "weight_loss";
    FitnessGoal["MUSCLE_GAIN"] = "muscle_gain";
    FitnessGoal["STRENGTH"] = "strength";
    FitnessGoal["ENDURANCE"] = "endurance";
    FitnessGoal["FLEXIBILITY"] = "flexibility";
    FitnessGoal["GENERAL_FITNESS"] = "general_fitness";
})(FitnessGoal || (exports.FitnessGoal = FitnessGoal = {}));
let FitnessProfile = class FitnessProfile extends mongoose_2.Document {
};
exports.FitnessProfile = FitnessProfile;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", user_schema_1.User)
], FitnessProfile.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(FitnessLevel),
        default: FitnessLevel.BEGINNER
    }),
    __metadata("design:type", String)
], FitnessProfile.prototype, "fitnessLevel", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [String],
        enum: Object.values(FitnessGoal),
        default: [FitnessGoal.GENERAL_FITNESS]
    }),
    __metadata("design:type", Array)
], FitnessProfile.prototype, "fitnessGoals", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], FitnessProfile.prototype, "preferredActivities", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], FitnessProfile.prototype, "height", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], FitnessProfile.prototype, "weight", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number }),
    __metadata("design:type", Number)
], FitnessProfile.prototype, "targetWeight", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], FitnessProfile.prototype, "hasInjuries", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], FitnessProfile.prototype, "injuries", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, min: 0, max: 7, default: 3 }),
    __metadata("design:type", Number)
], FitnessProfile.prototype, "availableWorkoutDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, min: 15, max: 120, default: 45 }),
    __metadata("design:type", Number)
], FitnessProfile.prototype, "preferredWorkoutDuration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], FitnessProfile.prototype, "hasGymAccess", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], FitnessProfile.prototype, "availableEquipment", void 0);
exports.FitnessProfile = FitnessProfile = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], FitnessProfile);
exports.FitnessProfileSchema = mongoose_1.SchemaFactory.createForClass(FitnessProfile);
//# sourceMappingURL=fitness-profile.schema.js.map