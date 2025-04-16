import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { SpoonacularService } from './spoonacular.service';
import { SpoonacularController } from './spoonacular.controller';
import { Food, FoodSchema } from '../../infrastructure/database/schemas/food.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    MongooseModule.forFeature([{ name: Food.name, schema: FoodSchema }]), // ✅ this line fixes it
  ],
  providers: [SpoonacularService],
  controllers: [SpoonacularController],
  exports: [SpoonacularService], // optional if other modules need it
})
export class SpoonacularModule {}
