import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class PostsPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async canViewPost(viewerUserId: bigint, postId: bigint): Promise<boolean> {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
        authorUserId: true,
        visibilityType: true,
      },
    });

    if (!post) {
      return false;
    }

    if (post.authorUserId === viewerUserId) {
      return true;
    }

    if (post.visibilityType === 'PUBLIC') {
      return true;
    }

    const [ab, ba] = await this.prisma.$transaction([
      this.prisma.fingerRelation.findFirst({
        where: {
          ownerUserId: post.authorUserId,
          targetUserId: viewerUserId,
          deletedAt: null,
        },
        select: { id: true },
      }),
      this.prisma.fingerRelation.findFirst({
        where: {
          ownerUserId: viewerUserId,
          targetUserId: post.authorUserId,
          deletedAt: null,
        },
        select: { id: true },
      }),
    ]);

    return !!ab && !!ba;
  }

  async canDeletePost(requestUserId: bigint, postId: bigint): Promise<boolean> {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        authorUserId: true,
      },
    });

    if (!post) {
      return false;
    }

    return post.authorUserId === requestUserId;
  }
}
