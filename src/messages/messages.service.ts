import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { MessageResponseMapper } from '../common/mappers/message-response.mapper';
import { NotificationsService } from '../notifications/notifications.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesPolicy } from './messages.policy';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesPolicy: MessagesPolicy,
    private readonly messageResponseMapper: MessageResponseMapper,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getMessages(
    requestUserId: bigint,
    roomId: bigint,
    cursor?: string,
    limit = 30,
  ) {
    const allowed = await this.messagesPolicy.canAccessMessages(
      requestUserId,
      roomId,
    );

    if (!allowed) {
      throw new NotFoundException('room not found');
    }

    const take = Math.min(Math.max(limit, 1), 50);
    const cursorId = cursor ? parseCursor(cursor) : null;

    const items = await this.prisma.message.findMany({
      where: {
        roomId,
        deletedAt: null,
        ...(cursorId
          ? {
              id: {
                lt: cursorId,
              },
            }
          : {}),
      },
      orderBy: {
        id: 'desc',
      },
      take: take + 1,
      select: {
        id: true,
        roomId: true,
        senderUserId: true,
        messageType: true,
        body: true,
        attachmentObjectKey: true,
        createdAt: true,
      },
    });

    const hasNext = items.length > take;
    const sliced = hasNext ? items.slice(0, take) : items;
    const nextCursor = hasNext ? sliced[sliced.length - 1].id : null;
    const mapped = await this.messageResponseMapper.mapMany(sliced);

    return {
      items: mapped,
      pageInfo: {
        hasNext,
        nextCursor,
      },
    };
  }

  async sendMessage(
    requestUserId: bigint,
    roomId: bigint,
    dto: SendMessageDto,
  ) {
    const allowed = await this.messagesPolicy.canSendMessage(
      requestUserId,
      roomId,
    );

    if (!allowed) {
      throw new ForbiddenException('cannot send message');
    }

    const room = await this.prisma.messageRoom.findUnique({
      where: { id: roomId },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    if (!room) {
      throw new NotFoundException('room not found');
    }

    const recipientUserId =
      room.user1Id === requestUserId ? room.user2Id : room.user1Id;

    const type = dto.type;

    if (type === 'TEXT') {
      const body = typeof dto.body === 'string' ? dto.body.trim() : '';

      if (!body) {
        throw new BadRequestException('text message body is required');
      }

      const message = await this.prisma.message.create({
        data: {
          roomId,
          senderUserId: requestUserId,
          messageType: 'TEXT',
          body,
          attachmentObjectKey: null,
        },
        select: {
          id: true,
          roomId: true,
          senderUserId: true,
          messageType: true,
          body: true,
          attachmentObjectKey: true,
          createdAt: true,
        },
      });

      await this.notificationsService.create({
        recipientUserId,
        actorUserId: requestUserId,
        type: 'MESSAGE',
        title: '새 메시지',
        body: body.length > 60 ? `${body.slice(0, 60)}…` : body,
        linkPath: `/dashboard/messages?roomId=${roomId.toString()}`,
      });

      return this.messageResponseMapper.map(message);
    }

    if (type === 'IMAGE') {
      const attachmentObjectKey =
        typeof dto.attachmentObjectKey === 'string'
          ? dto.attachmentObjectKey.trim()
          : '';

      if (!attachmentObjectKey) {
        throw new BadRequestException('image attachmentObjectKey is required');
      }

      const message = await this.prisma.message.create({
        data: {
          roomId,
          senderUserId: requestUserId,
          messageType: 'IMAGE',
          body: null,
          attachmentObjectKey,
        },
        select: {
          id: true,
          roomId: true,
          senderUserId: true,
          messageType: true,
          body: true,
          attachmentObjectKey: true,
          createdAt: true,
        },
      });

      await this.notificationsService.create({
        recipientUserId,
        actorUserId: requestUserId,
        type: 'MESSAGE',
        title: '새 메시지',
        body: '이미지를 보냈어요.',
        linkPath: `/dashboard/messages?roomId=${roomId.toString()}`,
      });

      return this.messageResponseMapper.map(message);
    }

    throw new BadRequestException('unsupported message type');
  }
}

function parseCursor(cursor: string): bigint {
  if (!/^[1-9]\d*$/.test(cursor)) {
    throw new BadRequestException('invalid cursor');
  }

  return BigInt(cursor);
}
