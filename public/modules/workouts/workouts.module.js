"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const workouts_controller_1 = require("./workouts.controller");
const workouts_service_1 = require("./services/workouts.service");
const ai_workout_service_1 = require("./services/ai-workout.service");
const fitness_profile_schema_1 = require("../../infrastructure/database/schemas/fitness-profile.schema");
const workout_plan_schema_1 = require("../../infrastructure/database/schemas/workout-plan.schema");
const gemini_module_1 = require("../../gemini/gemini.module");
let WorkoutsModule = class WorkoutsModule {
};
exports.WorkoutsModule = WorkoutsModule;
exports.WorkoutsModule = WorkoutsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            gemini_module_1.GeminiModule,
            mongoose_1.MongooseModule.forFeature([
                { name: fitness_profile_schema_1.FitnessProfile.name, schema: fitness_profile_schema_1.FitnessProfileSchema },
                { name: workout_plan_schema_1.WorkoutPlan.name, schema: workout_plan_schema_1.WorkoutPlanSchema },
            ]),
        ],
        controllers: [workouts_controller_1.WorkoutsController],
        providers: [workouts_service_1.WorkoutsService, ai_workout_service_1.AiWorkoutService],
        exports: [workouts_service_1.WorkoutsService],
    })
], WorkoutsModule);
//# sourceMappingURL=workouts.module.js.map