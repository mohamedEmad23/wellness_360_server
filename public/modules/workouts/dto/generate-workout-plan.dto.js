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
exports.GenerateWorkoutPlanDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const workout_plan_schema_1 = require("../../../infrastructure/database/schemas/workout-plan.schema");
class GenerateWorkoutPlanDto {
}
exports.GenerateWorkoutPlanDto = GenerateWorkoutPlanDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: workout_plan_schema_1.WorkoutType,
        description: 'Type of workout to generate',
        example: workout_plan_schema_1.WorkoutType.STRENGTH,
    }),
    (0, class_validator_1.IsEnum)(workout_plan_schema_1.WorkoutType),
    __metadata("design:type", String)
], GenerateWorkoutPlanDto.prototype, "workoutType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: workout_plan_schema_1.WorkoutDifficulty,
        description: 'Difficulty level of the workout',
        example: workout_plan_schema_1.WorkoutDifficulty.INTERMEDIATE,
    }),
    (0, class_validator_1.IsEnum)(workout_plan_schema_1.WorkoutDifficulty),
    __metadata("design:type", String)
], GenerateWorkoutPlanDto.prototype, "difficulty", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        isArray: true,
        description: 'Fitness goals to focus on',
        example: ['lose weight', 'build muscle', 'improve endurance'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], GenerateWorkoutPlanDto.prototype, "goals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        isArray: true,
        description: 'Specific body areas to target',
        example: ['chest', 'back', 'legs'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GenerateWorkoutPlanDto.prototype, "targetAreas", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'Number of weeks for the workout plan',
        minimum: 1,
        maximum: 12,
        default: 4,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], GenerateWorkoutPlanDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'Number of workout days per week',
        minimum: 1,
        maximum: 7,
        default: 3,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(7),
    __metadata("design:type", Number)
], GenerateWorkoutPlanDto.prototype, "daysPerWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'Target workout time in minutes per session',
        minimum: 15,
        maximum: 120,
        default: 45,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(120),
    __metadata("design:type", Number)
], GenerateWorkoutPlanDto.prototype, "workoutDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        isArray: true,
        description: 'Equipment available for use',
        example: ['dumbbells', 'bench', 'resistance bands'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GenerateWorkoutPlanDto.prototype, "availableEquipment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        isArray: true,
        description: 'List of injuries or limitations to consider',
        example: ['lower back pain', 'knee injury'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], GenerateWorkoutPlanDto.prototype, "limitations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Boolean,
        description: 'Whether user has access to a gym',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], GenerateWorkoutPlanDto.prototype, "hasGymAccess", void 0);
//# sourceMappingURL=generate-workout-plan.dto.js.map