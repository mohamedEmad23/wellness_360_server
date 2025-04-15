import { Controller,Get,Patch,Post,Body,Put,HttpCode,HttpStatus,Delete,Param,UseGuards,Request } from '@nestjs/common';
import { SleepService } from './sleep.service';
import {createSleepLogDTO} from '../sleep/dto/create-sleepLog.dto'
import {updateSleepLogDTO} from '../sleep/dto/update-sleepLog.dto'
import { ApiTags, ApiOperation, ApiResponse,ApiParam,ApiBody,ApiBearerAuth,ApiUnauthorizedResponse,ApiForbiddenResponse,ApiNotFoundResponse } from '@nestjs/swagger';
import { sleepLogSchema } from 'src/infrastructure/database/schemas/sleepLog.schema';
import { sleepLogInterface } from './interfaces/sleepLog.interface';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@ApiTags('Sleep Tracking')
@ApiBearerAuth()
@Controller('sleep')
export class SleepController {
  constructor(private sleepService: SleepService) {}
  
  @Get("avgDuration")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get Average Sleep Duration',
    description: 'Retrieves the average sleep duration for the authenticated user'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Average sleep duration retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        avgDuration: { type: 'number', example: 7.5, description: 'Average sleep duration in hours' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  getAVGtime(@Request() req) {
    return this.sleepService.avgDuration(req.user._id);
  }
  
  @Get("avgRating")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get Average Sleep Rating',
    description: 'Retrieves the average sleep quality rating for the authenticated user'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Average sleep rating retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        avgRating: { type: 'number', example: 4.2, description: 'Average sleep quality rating on a scale of 1-5' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  getAVGrating(@Request() req) {
    return this.sleepService.avgRating(req.user._id);
  }
  
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Get Sleep Logs',
    description: 'Retrieves all sleep logs for the authenticated user'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sleep logs retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '60d9f3a94f9a8d26f45b5e3c' },
          userId: { type: 'string', example: '60d9f3a94f9a8d26f45b5e3d' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          duration: { type: 'number', example: 8.5 },
          quality: { type: 'number', example: 4 },
          notes: { type: 'string', example: 'Slept well, but woke up once' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  getLogs(@Request() req) {
    return this.sleepService.getLogs(req.user._id);
  }
  
  @Post("add")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Add Sleep Log',
    description: 'Creates a new sleep log for the authenticated user'
  })
  @ApiBody({ 
    type: createSleepLogDTO,
    description: 'Sleep log data',
    examples: {
      example1: {
        value: {
          startTime: '2025-04-13T22:00:00Z',
          endTime: '2025-04-14T06:30:00Z',
          quality: 4,
          notes: 'Good sleep, woke up refreshed'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sleep log created successfully',
    schema: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '60d9f3a94f9a8d26f45b5e3c' },
        userId: { type: 'string', example: '60d9f3a94f9a8d26f45b5e3d' },
        startTime: { type: 'string', format: 'date-time' },
        endTime: { type: 'string', format: 'date-time' },
        duration: { type: 'number', example: 8.5 },
        quality: { type: 'number', example: 4 },
        notes: { type: 'string', example: 'Good sleep, woke up refreshed' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  addLog(@Request() req, @Body() data: createSleepLogDTO) {
    return this.sleepService.create(req.user._id, data);
  }
  
  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete Sleep Log',
    description: 'Deletes a specific sleep log by ID'
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The MongoDB ObjectId of the sleep log to delete',
    example: '60d9f3a94f9a8d26f45b5e3c'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sleep Log with ID:60d9f3a94f9a8d26f45b5e3c Successfully Deleted',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Sleep log deleted successfully' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Sleep Log does not belong to user' })
  @ApiNotFoundResponse({ description: 'Sleep log with specified ID not found' })
  deleteLog(@Request() req, @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId) {
    return this.sleepService.delete(id, req.user._id);
  }
  
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Update Sleep Log',
    description: 'Updates a specific sleep log by ID'
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'The MongoDB ObjectId of the sleep log to update',
    example: '60d9f3a94f9a8d26f45b5e3c'
  })
  @ApiBody({ 
    type: updateSleepLogDTO,
    description: 'Updated sleep log data',
    examples: {
      example1: {
        value: {
          quality: 5,
          notes: 'Updated: Great sleep, felt very refreshed'
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sleep log successfully updated',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Sleep Log with ID:60d9f3a94f9a8d26f45b5e3c successfully updated',
        }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized: JWT token is missing or invalid' })
  @ApiForbiddenResponse({ description: 'Sleep Log does not belong to user' })
  @ApiNotFoundResponse({ description: 'Sleep log with specified ID not found' })
  updateLog(
    @Request() req,
    @Param('id', new ParseObjectIdPipe()) id: Types.ObjectId,
    @Body() updateData: updateSleepLogDTO
  ) {
    return this.sleepService.update(id, req.user._id, updateData);
  }
}