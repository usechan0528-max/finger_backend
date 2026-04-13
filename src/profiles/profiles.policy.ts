import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

export type ProfileAccessLevel = 'SELF' | 'VISIBLE' | 'LIMITED';

@Injectable()
export class ProfilesPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async canViewProfile(
    viewerUserId: bigint,
    targetUserId: bigint,
  ): Promise<boolean> {
    if (viewerUserId === targetUserId) {
      return true;
    }

    const targetProfile = await this.prisma.profile.findUnique({
      where: { userId: targetUserId },
      select: { isInfluencerMode: true },
    });

    if (targetProfile?.isInfluencerMode) {
      return true;
    }

    return this.isMutualFinger(viewerUserId, targetUserId);
  }

  async getAccessLevel(
    viewerUserId: bigint,
    targetUserId: bigint,
  ): Promise<ProfileAccessLevel> {
    if (viewerUserId === targetUserId) {
      return 'SELF';
    }

    const canView = await this.canViewProfile(viewerUserId, targetUserId);
    return canView ? 'VISIBLE' : 'LIMITED';
  }

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
}
