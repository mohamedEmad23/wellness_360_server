import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { UserActivityModule } from './modules/user-activity/userActivity.module';
import { FoodModule } from './modules/meals/food.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    UserActivityModule,
    FoodModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
