"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModels = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const user_schema_1 = require("./schemas/user.schema");
const fitness_profile_schema_1 = require("./schemas/fitness-profile.schema");
const workout_plan_schema_1 = require("./schemas/workout-plan.schema");
exports.DatabaseModels = mongoose_1.MongooseModule.forFeature([
    { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
    { name: fitness_profile_schema_1.FitnessProfile.name, schema: fitness_profile_schema_1.FitnessProfileSchema },
    { name: workout_plan_schema_1.WorkoutPlan.name, schema: workout_plan_schema_1.WorkoutPlanSchema },
]);
//# sourceMappingURL=database.models.js.map