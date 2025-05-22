import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsDateString } from 'class-validator';
import { NotificationPriority, NotificationType } from '../../../infrastructure/database/schemas/notification.schema';

export class UpdateNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'Updated Workout Reminder',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Notification message',
    example: "It's time for your scheduled workout session!",
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.WORKOUT_REMINDER,
    required: false,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({
    description: 'Notification priority',
    enum: NotificationPriority,
    example: NotificationPriority.HIGH,
    required: false,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiProperty({
    description: 'Mark notification as read',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  read?: boolean;

  @ApiProperty({
    description: 'Action link to be triggered when notification is clicked',
    example: '/workouts/today',
    required: false,
  })
  @IsString()
  @IsOptional()
  actionLink?: string;

  @ApiProperty({
    description: 'Additional metadata for the notification',
    example: { workoutId: '12345', duration: '45min' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Schedule notification for later',
    example: '2023-07-25T10:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  scheduledFor?: Date;

  @ApiProperty({
    description: 'Expiration date for the notification',
    example: '2023-07-26T10:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: Date;

  @ApiProperty({
    description: 'Whether the notification is active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
} 