import { Body, Controller, Param, Post, Get, Put, Delete, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { FoodService } from './food.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/getUser.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Food')
@ApiBearerAuth()
@Controller('food')
@UseGuards(JwtAuthGuard)
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Post()
  @ApiOperation({ summary: 'Create a food item' })
  @ApiBody({ type: CreateFoodDto })
  @ApiResponse({ status: 201, description: 'Food item created successfully' })
  async createFood(@Body() dto: CreateFoodDto, @GetUser('userId') userId: string) {
    return this.foodService.createFood(dto, userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all food items created by a user' })
  @ApiResponse({ status: 200, description: 'List of user foods' })
  @ApiParam({ name: 'userId', type: String })
  async getUserFoods(@Param('userId') userId: string) {
    return this.foodService.getUserFoods(userId);
  }

  @Get('item/:id')
  @ApiOperation({ summary: 'Get a specific food item by its ID' })
  @ApiResponse({ status: 200, description: 'Returns a specific food item' })
  @ApiParam({ name: 'id', type: String })
  async getFoodById(@Param('id') id: string) {
    return this.foodService.getFoodById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a specific food item' })
  @ApiBody({ type: CreateFoodDto })
  @ApiResponse({ status: 200, description: 'Food item updated successfully' })
  @ApiParam({ name: 'id', type: String })
  async updateFood(@Param('id') id: string, @Body() dto: CreateFoodDto) {
    return this.foodService.updateFood(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a specific food item' })
  @ApiResponse({ status: 200, description: 'Food item deleted successfully' })
  @ApiParam({ name: 'id', type: String })
  async deleteFood(@Param('id') id: string) {
    return this.foodService.deleteFood(id);
  }

  @Post('eat-by-name/:food_name')
  @ApiOperation({ summary: 'Eat a food item by name and subtract calories from user' })
  @ApiParam({ name: 'food_name', type: String, description: 'Name of the food to be eaten' })
  @ApiResponse({ status: 200, description: 'Calories subtracted successfully from user' })
  async eatByName(
    @GetUser('userId') userId: string,
    @Param('food_name') foodName: string,
  ) {
    return this.foodService.eatByName(userId, foodName);
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Get foods by type (e.g., breakfast, snack)' })
  @ApiQuery({ name: 'type', required: true })
  async getFoodsByType(@Query('type') type: string) {
    return this.foodService.getFoodsByType(type);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all foods in the system' })
  async getAllFoods() {
    return this.foodService.getAllFoods();
  }

  @Post('log/:foodName')
  @ApiOperation({ summary: 'Log a meal and subtract calories from user' })
  @ApiParam({ name: 'foodName', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date in format DD/MM/YYYY h:mm am/pm',
          example: '15/04/2025 7:52 pm'
        },
        quantity: {
          type: 'number',
          description: 'Quantity of the food consumed',
          example: 2
        }
      },
      required: ['quantity']
    }
  })
  async logMeal(
    @GetUser('userId') userId: string,
    @Param('foodName') foodName: string,
    @Body('date') date?: string,
    @Body('quantity') quantity?: number,
  ) {
    let parsedDate: Date;
  
    if (quantity == null || isNaN(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive number');
    }
  
    if (date) {
      try {
        const parts = date.split(' ');
  
        const datePart = parts[0];
        const [day, month, year] = datePart.split('/').map(Number);
  
        const timePart = parts.slice(1).join(' ');
        const timeRegex = /(\d+):(\d+)\s*(am|pm|AM|PM)/i;
        const timeMatch = timePart.match(timeRegex);
  
        if (!timeMatch) {
          throw new Error(`Could not parse time from '${timePart}'. Please use format like "7:52 pm"`);
        }
  
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const isPM = timeMatch[3].toLowerCase() === 'pm';
  
        if (isPM && hours < 12) {
          hours += 12;
        } else if (!isPM && hours === 12) {
          hours = 0;
        }
  
        parsedDate = new Date(year, month - 1, day, hours, minutes);
  
        if (isNaN(parsedDate.getTime())) {
          throw new Error('The parsed date is invalid');
        }
      } catch (error) {
        throw new BadRequestException(
          `Invalid date format: ${error.message}. Please use format DD/MM/YYYY h:mm am/pm (e.g., 15/04/2025 7:52 pm)`,
        );
      }
    } else {
      parsedDate = new Date();
    }
  
    return this.foodService.logMeal(userId, foodName, parsedDate, quantity);
  }
  
  @Get('today-calories')
  @ApiOperation({ summary: 'Get total calories consumed today' })
  async getTodayCalories(@GetUser('userId') userId: string) {
    return this.foodService.getTodayCalories(userId);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset user calories and food log for the day' })
  async resetCalories(@GetUser('userId') userId: string) {
    return this.foodService.resetCalories(userId);
  }

  @Get('log/history')
  @ApiOperation({ summary: 'Get all logged meals for the user' })
  async getFoodLog(@GetUser('userId') userId: string) {
    return this.foodService.getFoodLog(userId);
  }
}