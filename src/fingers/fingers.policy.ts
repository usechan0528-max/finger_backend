import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class FingersPolicy {
  constructor(private readonly prisma: PrismaService) {}

  validateNotSelf(ownerUserId: bigint, targetUserId: bigint): void {
    if (ownerUserId === targetUserId) {
      throw new BadRequestException('cannot finger yourself');
    }
  }

  async isMutual(userA: bigint, userB: bigint): Promise<boolean> {
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

  async canAddFinger(ownerUserId: bigint): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: ownerUserId },
      select: { isInfluencerMode: true },
    });

    if (profile?.isInfluencerMode) {
      return true;
    }

    const activeCount = await this.prisma.fingerRelation.count({
      where: {
        ownerUserId,
        deletedAt: null,
        targetUser: {
          ownedFingers: {
            some: {
              targetUserId: ownerUserId,
              deletedAt: null,
            },
          },
        },
      },
    });

    return activeCount < 10;
  }
}
