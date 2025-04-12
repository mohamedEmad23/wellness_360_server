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
exports.WorkoutPlanSchema = exports.WorkoutPlan = exports.WorkoutDay = exports.Exercise = exports.WorkoutDifficulty = exports.WorkoutType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./user.schema");
var WorkoutType;
(function (WorkoutType) {
    WorkoutType["STRENGTH"] = "strength";
    WorkoutType["CARDIO"] = "cardio";
    WorkoutType["FLEXIBILITY"] = "flexibility";
    WorkoutType["HIIT"] = "hiit";
    WorkoutType["CIRCUIT"] = "circuit";
    WorkoutType["CUSTOM"] = "custom";
})(WorkoutType || (exports.WorkoutType = WorkoutType = {}));
var WorkoutDifficulty;
(function (WorkoutDifficulty) {
    WorkoutDifficulty["BEGINNER"] = "beginner";
    WorkoutDifficulty["INTERMEDIATE"] = "intermediate";
    WorkoutDifficulty["ADVANCED"] = "advanced";
})(WorkoutDifficulty || (exports.WorkoutDifficulty = WorkoutDifficulty = {}));
let Exercise = class Exercise {
};
exports.Exercise = Exercise;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Exercise.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Exercise.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], Exercise.prototype, "sets", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Exercise.prototype, "reps", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Exercise.prototype, "restBetweenSets", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Exercise.prototype, "targetMuscles", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], Exercise.prototype, "requiredEquipment", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Exercise.prototype, "notes", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Exercise.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Exercise.prototype, "videoUrl", void 0);
exports.Exercise = Exercise = __decorate([
    (0, mongoose_1.Schema)()
], Exercise);
let WorkoutDay = class WorkoutDay {
};
exports.WorkoutDay = WorkoutDay;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WorkoutDay.prototype, "day", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WorkoutDay.prototype, "focus", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WorkoutDay.prototype, "warmup", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [Exercise], required: true }),
    __metadata("design:type", Array)
], WorkoutDay.prototype, "exercises", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WorkoutDay.prototype, "cooldown", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], WorkoutDay.prototype, "duration", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WorkoutDay.prototype, "notes", void 0);
exports.WorkoutDay = WorkoutDay = __decorate([
    (0, mongoose_1.Schema)()
], WorkoutDay);
let WorkoutPlan = class WorkoutPlan extends mongoose_2.Document {
};
exports.WorkoutPlan = WorkoutPlan;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WorkoutPlan.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], WorkoutPlan.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Schema.Types.ObjectId, ref: 'User' }),
    __metadata("design:type", user_schema_1.User)
], WorkoutPlan.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(WorkoutType),
        required: true
    }),
    __metadata("design:type", String)
], WorkoutPlan.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: Object.values(WorkoutDifficulty),
        required: true
    }),
    __metadata("design:type", String)
], WorkoutPlan.prototype, "difficulty", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], WorkoutPlan.prototype, "goals", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], WorkoutPlan.prototype, "targetAreas", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [WorkoutDay], required: true }),
    __metadata("design:type", Array)
], WorkoutPlan.prototype, "workoutDays", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], WorkoutPlan.prototype, "isAiGenerated", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WorkoutPlan.prototype, "duration", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WorkoutPlan.prototype, "averageWorkoutTime", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], WorkoutPlan.prototype, "requiresEquipment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], WorkoutPlan.prototype, "requiredEquipment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WorkoutPlan.prototype, "rating", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], WorkoutPlan.prototype, "timesUsed", void 0);
exports.WorkoutPlan = WorkoutPlan = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], WorkoutPlan);
exports.WorkoutPlanSchema = mongoose_1.SchemaFactory.createForClass(WorkoutPlan);
//# sourceMappingURL=workout-plan.schema.js.map