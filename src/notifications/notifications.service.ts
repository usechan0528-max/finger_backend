import { Injectable } from '@nestjs/common';
import { MediaResolverService } from '../common/mappers/media-resolver.service';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaResolverService: MediaResolverService,
  ) {}

  async create(params: {
    recipientUserId: bigint;
    actorUserId?: bigint | null;
    type: 'MESSAGE' | 'COMMENT' | 'FINGER_MUTUAL' | 'SYSTEM';
    title: string;
    body: string;
    linkPath?: string | null;
  }) {
    return this.prisma.notification.create({
      data: {
        recipientUserId: params.recipientUserId,
        actorUserId: params.actorUserId ?? null,
        type: params.type,
        title: params.title,
        body: params.body,
        linkPath: params.linkPath ?? null,
      },
    });
  }

  async listRecent(recipientUserId: bigint, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 50);

    const notifications = await this.prisma.notification.findMany({
      where: {
        recipientUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take,
      include: {
        actor: {
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

    return {
      items: await Promise.all(
        notifications.map(async (notification) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          linkPath: notification.linkPath,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          actor: notification.actor
            ? {
                id: notification.actor.id,
                username: notification.actor.username,
                profile: notification.actor.profile
                  ? {
                      displayName: notification.actor.profile.displayName,
                      profileImageUrl:
                        await this.mediaResolverService.resolveProfileImageUrl(
                          notification.actor.profile.profileImageUrl,
                        ),
                      profileImageLayout: {
                        focusX: notification.actor.profile.profileImageFocusX,
                        focusY: notification.actor.profile.profileImageFocusY,
                        scale: notification.actor.profile.profileImageScale,
                      },
                    }
                  : null,
              }
            : null,
        })),
      ),
    };
  }

  async getUnreadCount(recipientUserId: bigint) {
    const unreadCount = await this.prisma.notification.count({
      where: {
        recipientUserId,
        isRead: false,
      },
    });

    return {
      unreadCount,
    };
  }

  async markAllAsRead(recipientUserId: bigint) {
    await this.prisma.notification.updateMany({
      where: {
        recipientUserId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return {
      marked: true,
    };
  }
}
