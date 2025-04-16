import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    BadRequestException,
  } from '@nestjs/common';
  import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
  } from '@nestjs/swagger';
  import { SpoonacularService } from './spoonacular.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { GetUser } from '../../common/decorators/getUser.decorator';
  
  @ApiTags('Spoonacular')
  @ApiBearerAuth()
  @Controller('spoonacular')
  @UseGuards(JwtAuthGuard)
  export class SpoonacularController {
    constructor(private readonly spoonacularService: SpoonacularService) {}
  
    @Get('food/:name')
    @ApiOperation({ summary: 'Search for a food by name (first match only)' })
    @ApiParam({ name: 'name', type: String })
    @ApiResponse({ status: 200, description: 'First matching food item returned' })
    async getFirstFoodMatch(@Param('name') name: string) {
      if (!name || typeof name !== 'string') {
        throw new BadRequestException('Food name must be a valid string');
      }
  
      const results = await this.spoonacularService.searchFoods(name, 0, 1);
      if (!results || !results.length) {
        throw new BadRequestException(`No food found for name: ${name}`);
      }
  
      return results[0];
    }
  
    @Get('food/:id/details')
    @ApiOperation({ summary: 'Get detailed food info by ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Detailed food information' })
    async getFoodDetails(@Param('id') id: number) {
      return this.spoonacularService.getFoodInformation(+id);
    }
  
    @Get('food/:id/nutrients')
    @ApiOperation({ summary: 'Get food nutrients by ID' })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Food nutrient info' })
    async getFoodNutrients(@Param('id') id: number) {
      return this.spoonacularService.getFoodNutrients(+id);
    }
  
    @Get('nutrition/guess')
    @ApiOperation({ summary: 'Guess nutrition info from food name' })
    @ApiQuery({ name: 'query', required: true })
    @ApiResponse({ status: 200, description: 'Guessed nutrition info' })
    async getNutritionByQuery(@Query('query') query: string) {
      if (!query) {
        throw new BadRequestException('Query parameter is required');
      }
  
      return this.spoonacularService.getNutritionByQuery(query);
    }
  }
  