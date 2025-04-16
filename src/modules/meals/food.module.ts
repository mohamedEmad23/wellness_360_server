import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';
import { Food, FoodSchema } from '../../infrastructure/database/schemas/food.schema';
import { User, UserSchema } from '../../infrastructure/database/schemas/user.schema';
import { FoodLog, FoodLogSchema } from 'src/infrastructure/database/schemas/foodLog';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Food.name, schema: FoodSchema },
      { name: User.name, schema: UserSchema },
      { name: FoodLog.name, schema: FoodLogSchema }, // ✅ Corrected this line
    ]),
  ],
  controllers: [FoodController],
  providers: [FoodService],
})
export class FoodModule {}
