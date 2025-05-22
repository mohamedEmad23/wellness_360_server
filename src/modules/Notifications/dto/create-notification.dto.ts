import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsObject, IsDateString } from 'class-validator';
import { NotificationPriority, NotificationType } from '../../../infrastructure/database/schemas/notification.schema';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'User ID to send the notification to',
    example: '60d5ec9d8e8c8a2d9c8e8c8a',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'Workout Reminder',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification message',
    example: "It's time for your daily workout!",
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: NotificationType.WORKOUT_REMINDER,
  })
  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @ApiProperty({
    description: 'Notification priority',
    enum: NotificationPriority,
    example: NotificationPriority.MEDIUM,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

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
    example: { workoutId: '12345', duration: '30min' },
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
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
} 