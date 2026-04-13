import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class MessageRoomsPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async isMutualFinger(userA: bigint, userB: bigint): Promise<boolean> {
    const [ab, ba] = await this.prisma.$transaction([
      this.prisma.fingerRelation.findFirst({
        where: {
          ownerUserId: userA,
          targetUserId: userB,
          deletedAt: null,
        },
        select: { id: true },
      }),
      this.prisma.fingerRelation.findFirst({
        where: {
          ownerUserId: userB,
          targetUserId: userA,
          deletedAt: null,
        },
        select: { id: true },
      }),
    ]);

    return !!ab && !!ba;
  }

  async canOpenRoom(
    requestUserId: bigint,
    otherUserId: bigint,
  ): Promise<boolean> {
    if (requestUserId === otherUserId) {
      return false;
    }

    return this.isMutualFinger(requestUserId, otherUserId);
  }

  async canAccessRoom(requestUserId: bigint, roomId: bigint): Promise<boolean> {
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
}
