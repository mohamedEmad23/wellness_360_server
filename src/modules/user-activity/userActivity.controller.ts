import { Body, Controller, Post, Get, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { UserActivityService } from './userActivity.service';
import { CreateUserActivityDto } from './dto/create-user-activity.dto';
import { UpdateUserActivityDto } from './dto/update-user-activity.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/getUser.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('User Activity')
@ApiBearerAuth()
@Controller('user-activity')
@UseGuards(JwtAuthGuard)
export class UserActivityController {
  constructor(private readonly userActivityService: UserActivityService) {}

  @Post()
  @ApiOperation({ summary: 'Log an activity for a user' })
  @ApiBody({ type: CreateUserActivityDto })
  @ApiResponse({ status: 201, description: 'Activity logged successfully' })
  async logActivity(@GetUser('userId') userId: string, @Body() dto: CreateUserActivityDto) {
    return this.userActivityService.logActivity(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all activities logged by a user' })
  @ApiResponse({ status: 200, description: 'Returns the list of user activities' })
  async getUserActivities(@GetUser('userId') userId: string) {
    return this.userActivityService.getUserActivities(userId);
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get all available activities' })
  @ApiResponse({ status: 200, description: 'Returns the list of available activities' })
  async getAllActivities() {
    return this.userActivityService.getAllActivities();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific user activity' })
  @ApiParam({ name: 'id', type: String, description: 'The ID of the user activity to delete' })
  @ApiResponse({ status: 200, description: 'Activity deleted successfully' })
  async deleteUserActivity(@Param('id') activityId: string, @GetUser('userId') userId: string) {
    return this.userActivityService.deleteUserActivity(activityId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing user activity' })
  @ApiParam({ name: 'id', type: String, description: 'The ID of the user activity to update' })
  @ApiBody({ type: UpdateUserActivityDto })
  @ApiResponse({ status: 200, description: 'Activity updated successfully' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async updateActivity(
    @Param('id') activityId: string,
    @GetUser('userId') userId: string,
    @Body() dto: UpdateUserActivityDto
  ) {
    return this.userActivityService.updateActivity(userId, activityId, dto);
  }
}
