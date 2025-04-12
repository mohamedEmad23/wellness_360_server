import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { FitnessProfile, FitnessProfileSchema } from './schemas/fitness-profile.schema';
import { WorkoutPlan, WorkoutPlanSchema } from './schemas/workout-plan.schema';

export const DatabaseModels = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
  { name: FitnessProfile.name, schema: FitnessProfileSchema },
  { name: WorkoutPlan.name, schema: WorkoutPlanSchema },
]);
