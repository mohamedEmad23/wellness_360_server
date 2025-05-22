import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { NotificationInterface } from './interfaces/notification.interface';

interface SocketWithAuth extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Allow frontend connections
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSocketMap: Map<string, Set<string>> = new Map();

  handleConnection(client: SocketWithAuth) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: SocketWithAuth) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove user from userSocketMap when they disconnect
    if (client.userId) {
      this.removeSocketFromUser(client.userId, client.id);
    }
  }

  /**
   * Authenticate user connection with user ID
   * This is called by the client to associate their socket with their user ID
   */
  @SubscribeMessage('authenticate')
  handleAuthentication(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() payload: { userId: string }
  ): { success: boolean } {
    try {
      const { userId } = payload;
        
      if (!userId) {
        this.logger.warn(`Authentication failed: Missing user ID`);
        return { success: false };
      }
      
      // Store the user ID on the socket
      client.userId = userId;
      
      // Add this socket to the user's set of connections
      this.addSocketToUser(userId, client.id);
      
      this.logger.log(`User ${userId} authenticated with socket ${client.id}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      return { success: false };
    }
  }

  /**
   * Add socket ID to user's connection set
   */
  private addSocketToUser(userId: string, socketId: string): void {
    if (!this.userSocketMap.has(userId)) {
      this.userSocketMap.set(userId, new Set());
    }
    
    this.userSocketMap.get(userId).add(socketId);
  }

  /**
   * Remove socket ID from user's connection set
   */
  private removeSocketFromUser(userId: string, socketId: string): void {
    const userSockets = this.userSocketMap.get(userId);
    
    if (userSockets) {
      userSockets.delete(socketId);
      
      // Clean up the map if no sockets remain for this user
      if (userSockets.size === 0) {
        this.userSocketMap.delete(userId);
      }
    }
  }

  /**
   * Send notification to a specific user across all their connected devices
   */
  sendNotificationToUser(userId: string, notification: NotificationInterface): boolean {
    const userSockets = this.userSocketMap.get(userId);
    
    if (!userSockets || userSockets.size === 0) {
      this.logger.warn(`No active connections for user ${userId}`);
      return false;
    }
    
    // Emit to all sockets associated with this user
    for (const socketId of userSockets) {
      this.server.to(socketId).emit('receive-notification', notification);
    }
    
    this.logger.log(`Notification sent to user ${userId} on ${userSockets.size} device(s)`);
    return true;
  }

  /**
   * Send notification to all connected clients (for admin use or global notifications)
   */
  @SubscribeMessage('send-notification')
  handleSendNotification(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() payload: any
  ): void {
    this.logger.log(`Sending notification: ${JSON.stringify(payload)}`);
    this.server.emit('receive-notification', payload);
  }

  /**
   * Send notification to read receipt to the server
   */
  @SubscribeMessage('notification-read')
  handleNotificationRead(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() payload: { notificationId: string }
  ): void {
    this.logger.log(`User ${client.userId} read notification ${payload.notificationId}`);
    // Note: The actual marking as read happens in the controller
  }
}
