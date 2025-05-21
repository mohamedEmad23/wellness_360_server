import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notification.gateway';

@Module({
providers: [NotificationsGateway],
})
export class NotificationsModule {}
