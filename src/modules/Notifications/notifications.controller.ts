import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  UseGuards, 
  Query, 
  Patch, 
  BadRequestException, 
  Logger, 
  HttpStatus, 
  HttpCode,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery, 
  ApiParam 
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/getUser.decorator';
import { NotificationType } from '../../infrastructure/database/schemas/notification.schema';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification for self (for testing)' })
  @ApiResponse({
    status: 201,
    description: 'The notification has been created',
  })
  async create(
    @GetUser('userId') userId: string,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    // Override userId in the DTO with the authenticated user's ID for security
    createNotificationDto.userId = userId;
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all notifications with pagination',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (starts from 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  async findAll(
    @GetUser('userId') userId: string,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationsService.findAllForUser(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Returns the count of unread notifications',
  })
  async getUnreadCount(
    @GetUser('userId') userId: string,
  ) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications have been marked as read',
  })
  async markAllAsRead(
    @GetUser('userId') userId: string,
  ) {
    const count = await this.notificationsService.markAllAsRead(userId);
    return { 
      message: 'All notifications marked as read',
      count 
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the notification',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.notificationsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been updated',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async update(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, userId, updateNotificationDto);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    description: 'The notification has been marked as read',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({
    status: 204,
    description: 'The notification has been deleted',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async remove(
    @Param('id') id: string,
    @GetUser('userId') userId: string,
  ) {
    await this.notificationsService.remove(id, userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all notifications for the current user' })
  @ApiResponse({
    status: 204,
    description: 'All notifications have been deleted',
  })
  async removeAll(
    @GetUser('userId') userId: string,
  ) {
    await this.notificationsService.removeAllForUser(userId);
  }
} 