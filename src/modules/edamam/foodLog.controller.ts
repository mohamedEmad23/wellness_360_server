import { Controller, Post, Body, Get, Query, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { EdamamService } from './edamam.service';
import { FoodLogService } from './foodLog.service';
import { CreateFoodLogDto } from './dto/create-food-log.dto';
import { LogFoodDto, LogFoodByInfoDto } from './dto/log-food.dto';
import { GetUser } from '../../common/decorators/getUser.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@ApiTags('food-log')
@ApiBearerAuth()
@Controller('food-log')
@UseGuards(JwtAuthGuard)
export class FoodLogController {
  constructor(
    private readonly edamamService: EdamamService,
    private readonly foodLogService: FoodLogService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Search for food suggestions by query' })
  @ApiResponse({ status: 200, description: 'Successfully fetched suggestions.' })
  @ApiResponse({ status: 500, description: 'Failed to fetch suggestions.' })
  async searchFoodSuggestions(@Query('query') query: string) {
    return this.edamamService.searchFoodSuggestions(query);
  }

  @Post('log-by-id')
  @ApiOperation({ summary: 'Log food directly by foodId, measureURI and quantity' })
  @ApiBody({ type: LogFoodByInfoDto })
  async logFoodBySelection(
    @GetUser('userId') userId: string,
    @Body() body: LogFoodByInfoDto
  ) {
    const foodLog = await this.edamamService.getNutrientsForFoodId(
      body.foodId,
      body.measureURI,
      body.quantity,
      body.title
    );
    await this.foodLogService.createFoodLog(foodLog, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Log food intake by description' })
  @ApiResponse({ status: 201, description: 'The food has been successfully logged.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiBody({ type: LogFoodDto })
  async logFood(
    @GetUser('userId') userId: string,
    @Body() body: LogFoodDto
  ) {
    
    const foodLog: CreateFoodLogDto = (await this.edamamService.analyzeFoodFromText(body.description))
    await this.foodLogService.createFoodLog(foodLog, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all food logs for a user' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved food logs.' })
  @ApiResponse({ status: 404, description: 'No food logs found for the user.' })
  async getUserFoodLogs(@GetUser('userId') userId: string) {
    return this.foodLogService.getUserFoodLogs(userId);
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Get food logs for a user by date' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved food logs for the specified date.' })
  @ApiResponse({ status: 404, description: 'No food logs found for the specified date.' })
  async getUserFoodLogsByDate(
    @GetUser('userId') userId: string,
    @Query('date') date: string
  ) {
    return this.foodLogService.getUserFoodLogsByDate(userId, new Date(date));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a food log by ID' })
  @ApiResponse({ status: 200, description: 'Successfully deleted the food log.' })
  @ApiResponse({ status: 404, description: 'Food log not found.' })
  async deleteUserFoodLog(
    @GetUser('userId') userId: string,
    @Param('id') foodLogId: string
  ) {
    return this.foodLogService.deleteUserFoodLog(userId, foodLogId);
  }
}