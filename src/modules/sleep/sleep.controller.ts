import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SleepService } from './sleep.service';
import { createSleepLogDTO } from '../sleep/dto/create-sleepLog.dto';
import { updateSleepLogDTO } from '../sleep/dto/update-sleepLog.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/getUser.decorator';

@ApiTags('Sleep Tracking')
@ApiBearerAuth()
@Controller('sleep')
export class SleepController {
  constructor(private readonly sleepService: SleepService) {}

  @Get('average-duration')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Average Sleep Duration' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns average sleep duration for authenticated user.',
    schema: {
      type: 'object',
      properties: {
        avg_duration: { type: 'number', example: 7.5 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  getAverageDuration(@GetUser('userId') userId: string) {
    return this.sleepService.avgDuration(userId);
  }

  @Get('average-rating')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get Average Sleep Rating' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns average sleep rating for authenticated user.',
    schema: {
      type: 'object',
      properties: {
        avg_rating: { type: 'number', example: 4.2 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  getAverageRating(@GetUser('userId') userId: string) {
    return this.sleepService.avgRating(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get All Sleep Logs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all sleep logs for authenticated user.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userID: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          duration: { type: 'number', example: 8.5 },
          rating: { type: 'number', example: 4 },
          notes: { type: 'string', example: 'Slept well, but woke up once' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  getLogs(@GetUser('userId') userId: string) {
    return this.sleepService.getLogs(userId);
  }

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add Sleep Log' })
  @ApiBody({
    type: createSleepLogDTO,
    description: 'Sleep log data',
    examples: {
      default: {
        value: {
          startTime: '2025-04-13T22:00:00Z',
          endTime: '2025-04-14T06:30:00Z',
          rating: 4,
          notes: 'Good sleep, woke up refreshed',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sleep log created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string' },
        userID: { type: 'string' },
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time' },
        duration: { type: 'number' },
        rating: { type: 'number' },
        notes: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  addLog(@GetUser('userId') userId: string, @Body() data: createSleepLogDTO) {
    return this.sleepService.create(userId, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete Sleep Log' })
  @ApiParam({
    name: 'id',
    description: 'Sleep log ID (MongoDB ObjectId)',
    type: 'string',
    example: '60d9f3a94f9a8d26f45b5e3c',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sleep log deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Sleep log with ID:xxxx deleted' },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Sleep Log does not belong to user' })
  @ApiNotFoundResponse({ description: 'Sleep log not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  deleteLog(@GetUser('userId') userId: string, @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId) {
    return this.sleepService.delete(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update Sleep Log' })
  @ApiParam({
    name: 'id',
    description: 'Sleep log ID (MongoDB ObjectId)',
    type: 'string',
    example: '60d9f3a94f9a8d26f45b5e3c',
  })
  @ApiBody({
    type: updateSleepLogDTO,
    description: 'Updated sleep log fields',
    examples: {
      default: {
        value: {
          rating: 5,
          notes: 'Updated: Great sleep, felt refreshed',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sleep log updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Sleep log with ID:xxxx updated' },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Sleep Log does not belong to user' })
  @ApiNotFoundResponse({ description: 'Sleep log not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  updateLog(
    @GetUser('userId') userId: string,
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
    @Body() updateData: updateSleepLogDTO,
  ) {
    return this.sleepService.update(id, userId, updateData);
  }
}
