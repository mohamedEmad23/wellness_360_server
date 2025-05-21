import {
WebSocketGateway,
SubscribeMessage,
WebSocketServer,
OnGatewayConnection,
OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
cors: {
    origin: '*', // allow frontend
},
})
export class NotificationsGateway
implements OnGatewayConnection, OnGatewayDisconnect
{
@WebSocketServer()
server: Server;

handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
}

handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
}

@SubscribeMessage('send-notification')
handleSendNotification(client: Socket, payload: any): void {
    console.log('Sending notification:', payload);
    this.server.emit('receive-notification', payload);
}
}
