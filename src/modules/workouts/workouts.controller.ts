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
    @Request() req,
    @Body() dto: CreateFitnessProfileDto,
  ) {
    try {
      return this.workoutsService.createOrUpdateFitnessProfile(req.user._id.toString(), dto);
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
  async getFitnessProfile(@Request() req) {
    try {
      return this.workoutsService.getFitnessProfile(req.user._id.toString());
    } catch (error) {
      this.handleServiceError(error, 'retrieve fitness profile');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI-based workout plan' })
  @ApiResponse({ status: 201, description: 'Workout plan generated successfully.' })
  async generateWorkoutPlan(
    @Request() req,
    @Body() dto: GenerateWorkoutPlanDto,
  ) {
    try {
      return this.workoutsService.generateWorkoutPlan(req.user._id.toString(), dto);
    } catch (error) {
      this.handleServiceError(error, 'generate workout plan');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('plans')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all workout plans' })
  @ApiResponse({ status: 200, description: 'Returns all user workout plans.' })
  async getUserWorkoutPlans(@Request() req) {
    try {
      return this.workoutsService.getUserWorkoutPlans(req.user._id.toString());
    } catch (error) {
      this.handleServiceError(error, 'retrieve workout plans');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('plans/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific workout plan' })
  @ApiResponse({ status: 200, description: 'Returns the specified workout plan.' })
  async getWorkoutPlan(@Param('id') id: string) {
    try {
      return this.workoutsService.getWorkoutPlan(id);
    } catch (error) {
      this.handleServiceError(error, 'retrieve workout plan');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('plans/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a workout plan' })
  @ApiResponse({ status: 200, description: 'Workout plan deleted successfully.' })
  async deleteWorkoutPlan(@Param('id') id: string) {
    try {
      await this.workoutsService.deleteWorkoutPlan(id);
      return { message: 'Workout plan deleted successfully' };
    } catch (error) {
      this.handleServiceError(error, 'delete workout plan');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('plans/:id/rate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a workout plan' })
  @ApiResponse({ status: 200, description: 'Workout plan rated successfully.' })
  async rateWorkoutPlan(
    @Param('id') id: string,
    @Body('rating') rating: number,
  ) {
    try {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new HttpException('Rating must be an integer between 1 and 5', HttpStatus.BAD_REQUEST);
      }
      return this.workoutsService.rateWorkoutPlan(id, rating);
    } catch (error) {
      this.handleServiceError(error, 'rate workout plan');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('plans/:id/track')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track workout plan usage' })
  @ApiResponse({ status: 200, description: 'Workout plan usage tracked.' })
  async trackWorkoutPlanUsage(@Param('id') id: string) {
    try {
      return this.workoutsService.trackWorkoutPlanUsage(id);
    } catch (error) {
      this.handleServiceError(error, 'track workout plan usage');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommended')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recommended workout plans' })
  @ApiResponse({ status: 200, description: 'Returns recommended workout plans.' })
  async getRecommendedWorkoutPlans(@Request() req) {
    try {
      return this.workoutsService.getRecommendedWorkoutPlans(req.user._id.toString());
    } catch (error) {
      this.handleServiceError(error, 'get recommended workout plans');
    }
  }
}
