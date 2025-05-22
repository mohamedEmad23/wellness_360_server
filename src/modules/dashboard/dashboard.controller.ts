import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  UserStatsDto, 
  ActivitySummaryDto, 
  NutritionSummaryDto, 
  SleepSummaryDto, 
  ProgressTrackingDto, 
  DashboardOverviewDto
} from './dto/dashboard.dto';
import { GetUser } from '../../common/decorators/getUser.decorator';
import { isValid, parseISO } from 'date-fns';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get complete dashboard overview for a user' })
  @ApiResponse({ status: 200, description: 'Dashboard overview data retrieved successfully', type: DashboardOverviewDto })
  async getDashboardOverview(@GetUser('userId') userId: string): Promise<DashboardOverviewDto> {
    return this.dashboardService.getDashboardOverview(userId);
  }

  @Get('user-stats')
  @ApiOperation({ summary: 'Get user stats' })
  @ApiResponse({ status: 200, description: 'User stats retrieved successfully', type: UserStatsDto })
  async getUserStats(@GetUser('userId') userId: string): Promise<UserStatsDto> {
    return this.dashboardService.getUserStats(userId);
  }

  @Get('user-profile')
  @ApiOperation({ summary: 'Get user profile data' })
  @ApiResponse({ status: 200, description: 'User profile data retrieved successfully' })
  async getUserProfile(@GetUser('userId') userId: string) {
    return this.dashboardService.getUserProfile(userId);
  }

  /**
   * Validate period and date parameters
   */
  private validateDateParams(period?: string, date?: string) {
    // Validate period
    if (period && !['daily', 'weekly', 'monthly'].includes(period)) {
      throw new BadRequestException('Period must be one of: daily, weekly, monthly');
    }
    
    // Validate date format if provided
    if (date) {
      try {
        const parsedDate = parseISO(date);
        if (!isValid(parsedDate)) {
          throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD format');
        }
      } catch (err) {
        throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD format');
      }
    }

    return { period: period as 'daily' | 'weekly' | 'monthly', date };
  }

  @Get('activity-summary')
  @ApiOperation({ summary: 'Get activity summary' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly'], required: false, description: 'Time period for data (defaults to weekly)' })
  @ApiQuery({ name: 'date', required: false, description: 'Optional specific date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Activity summary retrieved successfully', type: ActivitySummaryDto })
  async getActivitySummary(
    @GetUser('userId') userId: string,
    @Query('period') period?: string,
    @Query('date') date?: string,
  ): Promise<ActivitySummaryDto> {
    const validated = this.validateDateParams(period, date);
    return this.dashboardService.getActivitySummary(userId, validated.period, validated.date);
  }

  @Get('nutrition-summary')
  @ApiOperation({ summary: 'Get nutrition summary' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly'], required: false, description: 'Time period for data (defaults to weekly)' })
  @ApiQuery({ name: 'date', required: false, description: 'Optional specific date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Nutrition summary retrieved successfully', type: NutritionSummaryDto })
  async getNutritionSummary(
    @GetUser('userId') userId: string,
    @Query('period') period?: string,
    @Query('date') date?: string,
  ): Promise<NutritionSummaryDto> {
    const validated = this.validateDateParams(period, date);
    return this.dashboardService.getNutritionSummary(userId, validated.period, validated.date);
  }

  @Get('sleep-summary')
  @ApiOperation({ summary: 'Get sleep summary' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly'], required: false, description: 'Time period for data (defaults to weekly)' })
  @ApiQuery({ name: 'date', required: false, description: 'Optional specific date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Sleep summary retrieved successfully', type: SleepSummaryDto })
  async getSleepSummary(
    @GetUser('userId') userId: string,
    @Query('period') period?: string,
    @Query('date') date?: string,
  ): Promise<SleepSummaryDto> {
    const validated = this.validateDateParams(period, date);
    return this.dashboardService.getSleepSummary(userId, validated.period, validated.date);
  }

  @Get('progress-tracking')
  @ApiOperation({ summary: 'Get progress tracking data' })
  @ApiResponse({ status: 200, description: 'Progress tracking data retrieved successfully', type: ProgressTrackingDto })
  async getProgressTracking(@GetUser('userId') userId: string): Promise<ProgressTrackingDto> {
    return this.dashboardService.getProgressTracking(userId);
  }
} 