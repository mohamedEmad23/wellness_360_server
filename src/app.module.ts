import { ConfigurableModuleBuilder, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { AuthModule } from './core/auth/auth.module';
import { HealthModule } from './core/health/health.module';
import { UsersModule } from './features/users/users.module';
import { ProfilesModule } from './features/profiles/profiles.module';
import { FitnessLogsModule } from './features/fitness-logs/fitness-logs.module';
import { MealsModule } from './features/meals/meals.module';
import { SleepModule } from './features/sleep/sleep.module';
import { AdminModule } from './features/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    UsersModule,
    ProfilesModule,
    FitnessLogsModule,
    MealsModule,
    SleepModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
