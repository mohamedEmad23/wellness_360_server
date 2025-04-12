import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Post, 
  Put, 
  Request, 
  UseGuards 
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
    description: 'The fitness profile has been successfully created or updated.',
  })
  async createOrUpdateFitnessProfile(
    @Request() req,
    @Body() createFitnessProfileDto: CreateFitnessProfileDto,
  ) {
    return this.workoutsService.createOrUpdateFitnessProfile(
      req.user._id.toString(),
      createFitnessProfileDto,
    );
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
    return this.workoutsService.getFitnessProfile(req.user._id.toString());
  }

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a workout plan using AI' })
  @ApiResponse({
    status: 201,
    description: 'The workout plan has been successfully generated.',
  })
  async generateWorkoutPlan(
    @Request() req,
    @Body() generateWorkoutPlanDto: GenerateWorkoutPlanDto,
  ) {
    return this.workoutsService.generateWorkoutPlan(
      req.user._id.toString(),
      generateWorkoutPlanDto,
    );
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
    return this.workoutsService.getUserWorkoutPlans(req.user._id.toString());
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
    return this.workoutsService.getWorkoutPlan(id);
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
    await this.workoutsService.deleteWorkoutPlan(id);
    return { message: 'Workout plan deleted successfully' };
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
    return this.workoutsService.rateWorkoutPlan(id, rating);
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
    return this.workoutsService.trackWorkoutPlanUsage(id);
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
    return this.workoutsService.getRecommendedWorkoutPlans(req.user._id.toString());
  }
}