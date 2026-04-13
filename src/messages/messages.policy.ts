import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class MessagesPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async canAccessMessages(
    requestUserId: bigint,
    roomId: bigint,
  ): Promise<boolean> {
    const room = await this.prisma.messageRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
        status: true,
      },
    });

    if (!room || room.status !== 'ACTIVE') {
      return false;
    }

    return room.user1Id === requestUserId || room.user2Id === requestUserId;
  }

  async canSendMessage(
    requestUserId: bigint,
    roomId: bigint,
  ): Promise<boolean> {
    const room = await this.prisma.messageRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
        status: true,
      },
    });

    if (!room || room.status !== 'ACTIVE') {
      return false;
    }

    if (room.user1Id !== requestUserId && room.user2Id !== requestUserId) {
      return false;
    }

    const [ab, ba] = await this.prisma.$transaction([
      this.prisma.fingerRelation.findFirst({
        where: {
          ownerUserId: room.user1Id,
          targetUserId: room.user2Id,
          deletedAt: null,
        },
        select: { id: true },
      }),
      this.prisma.fingerRelation.findFirst({
        where: {
          ownerUserId: room.user2Id,
          targetUserId: room.user1Id,
          deletedAt: null,
        },
        select: { id: true },
      }),
    ]);

    return !!ab && !!ba;
  }
}
