import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';
import { Food, FoodSchema } from '../../infrastructure/database/schemas/food.schema';
import { User, UserSchema } from '../../infrastructure/database/schemas/user.schema';
import { FoodLog, FoodLogSchema } from 'src/infrastructure/database/schemas/foodLog';
import { SpoonacularModule } from './spoonacular.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Food.name, schema: FoodSchema },
      { name: User.name, schema: UserSchema },
      { name: FoodLog.name, schema: FoodLogSchema },
    ]),
    SpoonacularModule, // <-- Add this
  ],
  providers: [FoodService],
  controllers: [FoodController],
})
export class FoodModule {}