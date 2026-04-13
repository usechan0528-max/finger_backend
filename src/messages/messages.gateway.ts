import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { MessageRoomsPolicy } from '../message-rooms/message-rooms.policy';
import { MessagesService } from './messages.service';

@WebSocketGateway({
  namespace: '/messages',
  cors: true,
})
export class MessagesGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly messageRoomsPolicy: MessageRoomsPolicy,
    private readonly messagesService: MessagesService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      if (!payload.sub) {
        client.disconnect();
        return;
      }

      client.data.user = {
        userId: payload.sub,
      };
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('room:join')
  async joinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const userId = this.getClientUserId(client);
    const roomId = this.parseSocketId(body?.roomId);

    const allowed = await this.messageRoomsPolicy.canAccessRoom(userId, roomId);

    if (!allowed) {
      throw new WsException('cannot access room');
    }

    await client.join(`room:${roomId.toString()}`);

    return {
      ok: true,
      roomId: roomId.toString(),
    };
  }

  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      roomId: string;
      type: 'TEXT' | 'IMAGE';
      body?: string;
      attachmentObjectKey?: string;
    },
  ) {
    const userId = this.getClientUserId(client);
    const roomId = this.parseSocketId(body?.roomId);

    if (body?.type !== 'TEXT' && body?.type !== 'IMAGE') {
      throw new WsException('unsupported message type');
    }

    const message = await this.messagesService.sendMessage(userId, roomId, {
      type: body.type,
      body: body.body,
      attachmentObjectKey: body.attachmentObjectKey,
    });

    this.server.to(`room:${roomId.toString()}`).emit('message:new', message);

    return {
      ok: true,
      message,
    };
  }

  private getClientUserId(client: Socket): bigint {
    const userId = client.data.user?.userId;

    if (!userId) {
      throw new WsException('unauthorized');
    }

    return this.parseSocketId(String(userId));
  }

  private parseSocketId(value: unknown): bigint {
    if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
      throw new WsException('invalid id');
    }

    return BigInt(value);
  }
}
