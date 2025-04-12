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
exports.CreateFitnessProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const fitness_profile_schema_1 = require("../../../infrastructure/database/schemas/fitness-profile.schema");
class CreateFitnessProfileDto {
}
exports.CreateFitnessProfileDto = CreateFitnessProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: fitness_profile_schema_1.FitnessLevel,
        default: fitness_profile_schema_1.FitnessLevel.BEGINNER,
        description: 'User fitness level',
    }),
    (0, class_validator_1.IsEnum)(fitness_profile_schema_1.FitnessLevel),
    __metadata("design:type", String)
], CreateFitnessProfileDto.prototype, "fitnessLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: fitness_profile_schema_1.FitnessGoal,
        isArray: true,
        description: 'User fitness goals',
        example: [fitness_profile_schema_1.FitnessGoal.WEIGHT_LOSS, fitness_profile_schema_1.FitnessGoal.ENDURANCE],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(fitness_profile_schema_1.FitnessGoal, { each: true }),
    __metadata("design:type", Array)
], CreateFitnessProfileDto.prototype, "fitnessGoals", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        isArray: true,
        description: 'Preferred fitness activities',
        example: ['running', 'swimming', 'weightlifting'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateFitnessProfileDto.prototype, "preferredActivities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'User height in centimeters',
        example: 175,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFitnessProfileDto.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'User weight in kilograms',
        example: 70,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFitnessProfileDto.prototype, "weight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'User target weight in kilograms',
        example: 65,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFitnessProfileDto.prototype, "targetWeight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Boolean,
        description: 'Whether the user has any injuries',
        default: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateFitnessProfileDto.prototype, "hasInjuries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        isArray: true,
        description: 'Description of user injuries',
        example: ['lower back pain', 'knee injury'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateFitnessProfileDto.prototype, "injuries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'Number of days per week available for working out',
        minimum: 0,
        maximum: 7,
        default: 3,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(7),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFitnessProfileDto.prototype, "availableWorkoutDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'Preferred workout duration in minutes',
        minimum: 15,
        maximum: 120,
        default: 45,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(120),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateFitnessProfileDto.prototype, "preferredWorkoutDuration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Boolean,
        description: 'Whether the user has access to a gym',
        default: false,
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateFitnessProfileDto.prototype, "hasGymAccess", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        isArray: true,
        description: 'Equipment available to the user',
        example: ['dumbbells', 'resistance bands', 'yoga mat'],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateFitnessProfileDto.prototype, "availableEquipment", void 0);
//# sourceMappingURL=create-fitness-profile.dto.js.map