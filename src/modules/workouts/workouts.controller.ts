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
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkoutsService } from '../workouts/services/workouts.service';
import { CreateFitnessProfileDto } from '../workouts/dto/create-fitness-profile.dto';
import { GenerateWorkoutPlanDto } from '../workouts/dto/generate-workout-plan.dto';

@ApiTags('Workouts')
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update fitness profile' })
  @ApiResponse({
    status: 201,
    description:
      'The fitness profile has been successfully created or updated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.',
  })
  async createOrUpdateFitnessProfile(
    @Request() req,
    @Body() createFitnessProfileDto: CreateFitnessProfileDto,
  ) {
    try {
      // The class-validator decorators will handle validation automatically
      return this.workoutsService.createOrUpdateFitnessProfile(
        req.user._id.toString(),
        createFitnessProfileDto,
      );
    } catch (error) {
      // Pass through BadRequestExceptions from validation
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle other errors
      throw new HttpException(
        `Failed to create fitness profile: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user fitness profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user fitness profile.',
  })
  @ApiResponse({
    status: 404,
    description: 'Fitness profile not found.',
  })
  async getFitnessProfile(@Request() req) {
    try {
      return this.workoutsService.getFitnessProfile(req.user._id.toString());
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve fitness profile: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a workout plan using AI' })
  @ApiResponse({
    status: 201,
    description: 'The workout plan has been successfully generated.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: 500,
    description: 'Error generating workout plan.',
  })
  async generateWorkoutPlan(
    @Request() req,
    @Body() generateWorkoutPlanDto: GenerateWorkoutPlanDto,
  ) {
    try {
      return this.workoutsService.generateWorkoutPlan(
        req.user._id.toString(),
        generateWorkoutPlanDto,
      );
    } catch (error) {
      // Pass through BadRequestExceptions from validation
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle AI service errors specifically
      if (
        error.message?.includes('Failed to generate') ||
        error.message?.includes('parsing')
      ) {
        throw new HttpException(
          'Error generating workout plan. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Handle other errors
      throw new HttpException(
        `Failed to generate workout plan: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('plans')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all user workout plans' })
  @ApiResponse({
    status: 200,
    description: 'Returns all workout plans for the user.',
  })
  async getUserWorkoutPlans(@Request() req) {
    try {
      return this.workoutsService.getUserWorkoutPlans(req.user._id.toString());
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve workout plans: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('plans/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific workout plan' })
  @ApiResponse({
    status: 200,
    description: 'Returns the specified workout plan.',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan not found.',
  })
  async getWorkoutPlan(@Param('id') id: string) {
    try {
      return this.workoutsService.getWorkoutPlan(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to retrieve workout plan: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('plans/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a workout plan' })
  @ApiResponse({
    status: 200,
    description: 'The workout plan has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan not found.',
  })
  async deleteWorkoutPlan(@Param('id') id: string) {
    try {
      await this.workoutsService.deleteWorkoutPlan(id);
      return { message: 'Workout plan deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to delete workout plan: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('plans/:id/rate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a workout plan' })
  @ApiResponse({
    status: 200,
    description: 'The workout plan has been successfully rated.',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan not found.',
  })
  async rateWorkoutPlan(
    @Param('id') id: string,
    @Body('rating') rating: number,
  ) {
    try {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new HttpException(
          'Rating must be an integer between 1 and 5',
          HttpStatus.BAD_REQUEST,
        );
      }

      return this.workoutsService.rateWorkoutPlan(id, rating);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to rate workout plan: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('plans/:id/track')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track usage of a workout plan' })
  @ApiResponse({
    status: 200,
    description: 'The workout plan usage has been tracked.',
  })
  @ApiResponse({
    status: 404,
    description: 'Workout plan not found.',
  })
  async trackWorkoutPlanUsage(@Param('id') id: string) {
    try {
      return this.workoutsService.trackWorkoutPlanUsage(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to track workout plan usage: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommended')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recommended workout plans' })
  @ApiResponse({
    status: 200,
    description: 'Returns recommended workout plans for the user.',
  })
  async getRecommendedWorkoutPlans(@Request() req) {
    try {
      return this.workoutsService.getRecommendedWorkoutPlans(
        req.user._id.toString(),
      );
    } catch (error) {
      throw new HttpException(
        `Failed to get recommended workout plans: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
