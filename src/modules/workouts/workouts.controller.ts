import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkoutsService } from '../workouts/services/workouts.service';
import { CreateFitnessProfileDto } from '../workouts/dto/create-fitness-profile.dto';
import { GenerateWorkoutPlanDto } from '../workouts/dto/generate-workout-plan.dto';
import { GetUser } from '../../common/decorators/getUser.decorator';
import { WorkoutType, WorkoutDifficulty } from '../../infrastructure/database/schemas/workout-plan.schema';
import { ApiProperty } from '@nestjs/swagger';

// Create a simple DTO for workout plan generation
class GenerateWorkoutTypeDto {
  @ApiProperty({ 
    enum: WorkoutType, 
    description: 'Type of workout to generate',
    example: WorkoutType.STRENGTH,
    required: false
  })
  type?: WorkoutType;
}

// DTO for marking workout day as completed
class CompleteWorkoutDayDto {
  @ApiProperty({ 
    type: Number, 
    description: 'Day index (0-6) to mark as completed',
    example: 0,
    minimum: 0,
    maximum: 6
  })
  dayIndex: number;

  @ApiProperty({ 
    type: String, 
    description: 'ID of the workout plan',
    example: '60d21b4667d0d01ce8541e68'
  })
  workoutPlanId: string;
}

@ApiTags('Workouts')
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  private handleServiceError(error: any, context: string) {
    if (error instanceof HttpException) throw error;

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      throw new HttpException({ message: 'Validation failed', errors: messages }, HttpStatus.BAD_REQUEST);
    }

    if (error.name === 'MongoServerError' && error.code === 121) {
      throw new HttpException('Invalid enum value provided.', HttpStatus.BAD_REQUEST);
    }

    if (error.message?.includes('Failed to generate') || error.message?.includes('parsing')) {
      throw new HttpException('AI service error. Try again later.', HttpStatus.SERVICE_UNAVAILABLE);
    }

    throw new HttpException(`Failed to ${context}: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update fitness profile' })
  @ApiResponse({ status: 201, description: 'Profile created/updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async createOrUpdateFitnessProfile(
    @GetUser('userId') userId: string,
    @Body() dto: CreateFitnessProfileDto,
  ) {
    try {
      return this.workoutsService.createOrUpdateFitnessProfile(userId, dto);
    } catch (error) {
      this.handleServiceError(error, 'create fitness profile');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get fitness profile' })
  @ApiResponse({ status: 200, description: 'Returns user fitness profile.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async getFitnessProfile(@GetUser('userId') userId: string) {
    try {
      return this.workoutsService.getFitnessProfile(userId);
    } catch (error) {
      this.handleServiceError(error, 'retrieve fitness profile');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI-based workout plan using existing profile' })
  @ApiResponse({ status: 201, description: 'Workout plan generated successfully.' })
  @ApiResponse({ status: 404, description: 'Fitness profile not found.' })
  @ApiBody({ type: GenerateWorkoutTypeDto, required: false })
  async generateWorkoutPlan(
    @GetUser('userId') userId: string,
    @Body() dto?: GenerateWorkoutTypeDto
  ) {
    try {
      const customOptions = { workoutType: dto?.type };
      return this.workoutsService.generateWorkoutPlanFromProfile(userId, customOptions);
    } catch (error) {
      this.handleServiceError(error, 'generate workout plan');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('plan')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current workout plan' })
  @ApiResponse({ status: 200, description: 'Returns current workout plan.' })
  @ApiResponse({ status: 404, description: 'Workout plan not found.' })
  async getCurrentWorkoutPlan(@GetUser('userId') userId: string) {
    try {
      return this.workoutsService.getUserCurrentWorkoutPlan(userId);
    } catch (error) {
      this.handleServiceError(error, 'retrieve current workout plan');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('plan/complete-day')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a workout day as completed' })
  @ApiResponse({ status: 200, description: 'Workout day marked as completed.' })
  @ApiResponse({ status: 404, description: 'Workout plan not found.' })
  @ApiBody({ type: CompleteWorkoutDayDto })
  async completeWorkoutDay(
    @GetUser('userId') userId: string,
    @Body() dto: CompleteWorkoutDayDto
  ) {
    try {
      return this.workoutsService.markWorkoutDayAsCompleted(userId, dto.workoutPlanId, dto.dayIndex);
    } catch (error) {
      this.handleServiceError(error, 'mark workout day as completed');
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('calories/total')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get total calories burned' })
  @ApiResponse({ status: 200, description: 'Returns total calories burned.' })
  async getTotalCaloriesBurned(@GetUser('userId') userId: string) {
    try {
      const totalCalories = await this.workoutsService.getUserTotalCaloriesBurned(userId);
      return { totalCaloriesBurned: totalCalories };
    } catch (error) {
      this.handleServiceError(error, 'retrieve total calories burned');
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('calories/daily')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get daily calories burned' })
  @ApiResponse({ status: 200, description: 'Returns daily calories burned.' })
  async getDailyCaloriesBurned(@GetUser('userId') userId: string) {
    try {
      const dailyCalories = await this.workoutsService.getUserDailyCaloriesBurned(userId);
      return { dailyCaloriesBurned: dailyCalories };
    } catch (error) {
      this.handleServiceError(error, 'retrieve daily calories burned');
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('calories/weekly')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get weekly calories burned' })
  @ApiResponse({ status: 200, description: 'Returns weekly calories burned.' })
  async getWeeklyCaloriesBurned(@GetUser('userId') userId: string) {
    try {
      const weeklyCalories = await this.workoutsService.getUserWeeklyCaloriesBurned(userId);
      return { weeklyCaloriesBurned: weeklyCalories };
    } catch (error) {
      this.handleServiceError(error, 'retrieve weekly calories burned');
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('calories/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all calories burned statistics' })
  @ApiResponse({ status: 200, description: 'Returns all calories burned metrics.' })
  async getCaloriesStats(@GetUser('userId') userId: string) {
    try {
      const daily = await this.workoutsService.getUserDailyCaloriesBurned(userId);
      const weekly = await this.workoutsService.getUserWeeklyCaloriesBurned(userId);
      const total = await this.workoutsService.getUserTotalCaloriesBurned(userId);
      
      return {
        dailyCaloriesBurned: daily,
        weeklyCaloriesBurned: weekly,
        totalCaloriesBurned: total
      };
    } catch (error) {
      this.handleServiceError(error, 'retrieve calories stats');
    }
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('calories/history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get workout history with calories burned' })
  @ApiResponse({ status: 200, description: 'Returns workout history with calories burned.' })
  async getWorkoutHistory(
    @GetUser('userId') userId: string,
    @Query('limit') limit: string
  ) {
    try {
      const limitNumber = limit ? parseInt(limit, 10) : 10;
      const history = await this.workoutsService.getUserWorkoutHistory(userId, limitNumber);
      return { workoutSessions: history };
    } catch (error) {
      this.handleServiceError(error, 'retrieve workout history');
    }
  }
}
