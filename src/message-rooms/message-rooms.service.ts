import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageResponseMapper } from '../common/mappers/message-response.mapper';
import { normalizeUserPair } from '../common/utils/pair.util';
import { PrismaService } from '../database/prisma/prisma.service';
import { MessageRoomsPolicy } from './message-rooms.policy';

@Injectable()
export class MessageRoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageRoomsPolicy: MessageRoomsPolicy,
    private readonly messageResponseMapper: MessageResponseMapper,
  ) {}

  async createOrGetRoom(requestUserId: bigint, otherUserId: bigint) {
    if (requestUserId === otherUserId) {
      throw new BadRequestException('cannot create room with self');
    }

    const allowed = await this.messageRoomsPolicy.canOpenRoom(
      requestUserId,
      otherUserId,
    );

    if (!allowed) {
      throw new ForbiddenException('not mutual finger');
    }

    const { user1Id, user2Id } = normalizeUserPair(requestUserId, otherUserId);

    return this.prisma.messageRoom.upsert({
      where: {
        user1Id_user2Id: {
          user1Id,
          user2Id,
        },
      },
      update: {
        status: 'ACTIVE',
        deactivatedAt: null,
      },
      create: {
        user1Id,
        user2Id,
        status: 'ACTIVE',
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                profileImageUrl: true,
                profileImageFocusX: true,
                profileImageFocusY: true,
                profileImageScale: true,
              },
            },
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                profileImageUrl: true,
                profileImageFocusX: true,
                profileImageFocusY: true,
                profileImageScale: true,
              },
            },
          },
        },
      },
    });
  }

  async getMyRooms(requestUserId: bigint) {
    const rooms = await this.prisma.messageRoom.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ user1Id: requestUserId }, { user2Id: requestUserId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                profileImageUrl: true,
                profileImageFocusX: true,
                profileImageFocusY: true,
                profileImageScale: true,
              },
            },
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                profileImageUrl: true,
                profileImageFocusX: true,
                profileImageFocusY: true,
                profileImageScale: true,
              },
            },
          },
        },
        messages: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            id: 'desc',
          },
          take: 1,
          select: {
            id: true,
            roomId: true,
            messageType: true,
            body: true,
            attachmentObjectKey: true,
            senderUserId: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    const items = await Promise.all(
      rooms.map(async (room) => {
        const otherUser = room.user1Id === requestUserId ? room.user2 : room.user1;
        const lastMessage = room.messages[0]
          ? await this.messageResponseMapper.map(room.messages[0])
          : null;

        return {
          id: room.id,
          status: room.status,
          createdAt: room.createdAt,
          otherUser: {
            ...otherUser,
            profile: otherUser.profile
              ? {
                  ...otherUser.profile,
                  profileImageLayout: {
                    focusX: otherUser.profile.profileImageFocusX,
                    focusY: otherUser.profile.profileImageFocusY,
                    scale: otherUser.profile.profileImageScale,
                  },
                }
              : null,
          },
          lastMessage,
        };
      }),
    );

    return {
      items,
    };
  }

  async getRoomOrFail(requestUserId: bigint, roomId: bigint) {
    const allowed = await this.messageRoomsPolicy.canAccessRoom(
      requestUserId,
      roomId,
    );

    if (!allowed) {
      throw new NotFoundException('room not found');
    }

    const room = await this.prisma.messageRoom.findUnique({
      where: { id: roomId },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                profileImageUrl: true,
              },
            },
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            profile: {
              select: {
                displayName: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException('room not found');
    }

    return room;
  }
}
