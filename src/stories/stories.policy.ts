import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class StoriesPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async canViewStory(viewerUserId: bigint, storyId: bigint): Promise<boolean> {
    const now = new Date();

    const story = await this.prisma.story.findFirst({
      where: {
        id: storyId,
        deletedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
        authorUserId: true,
        visibilityType: true,
      },
    });

    if (!story) {
      return false;
    }

    if (story.authorUserId === viewerUserId) {
      return true;
    }

    if (story.visibilityType === 'PUBLIC') {
      return true;
    }

    const [ab, ba] = await this.prisma.$transaction([
      this.prisma.fingerRelation.findFirst({
        where: {
          ownerUserId: story.authorUserId,
          targetUserId: viewerUserId,
          deletedAt: null,
        },
        select: { id: true },
      }),
      this.prisma.fingerRelation.findFirst({
        where: {
          ownerUserId: viewerUserId,
          targetUserId: story.authorUserId,
          deletedAt: null,
        },
        select: { id: true },
      }),
    ]);

    return !!ab && !!ba;
  }

  async canDeleteStory(
    requestUserId: bigint,
    storyId: bigint,
  ): Promise<boolean> {
    const story = await this.prisma.story.findFirst({
      where: {
        id: storyId,
        deletedAt: null,
      },
      select: {
        authorUserId: true,
      },
    });

    if (!story) {
      return false;
    }

    return story.authorUserId === requestUserId;
  }
}
