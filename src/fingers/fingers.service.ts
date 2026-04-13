import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { normalizeUserPair } from '../common/utils/pair.util';
import { NotificationsService } from '../notifications/notifications.service';
import { FingersPolicy } from './fingers.policy';

@Injectable()
export class FingersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fingersPolicy: FingersPolicy,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getMyFingers(ownerUserId: bigint) {
    const fingers = await this.prisma.fingerRelation.findMany({
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
      include: {
        targetUser: {
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      count: fingers.length,
      items: fingers.map((relation) => ({
        relationId: relation.id,
        user: {
          ...relation.targetUser,
          profile: relation.targetUser.profile
            ? {
                ...relation.targetUser.profile,
                profileImageLayout: {
                  focusX: relation.targetUser.profile.profileImageFocusX,
                  focusY: relation.targetUser.profile.profileImageFocusY,
                  scale: relation.targetUser.profile.profileImageScale,
                },
              }
            : null,
        },
        createdAt: relation.createdAt,
      })),
    };
  }

  async getMyPendingRequests(ownerUserId: bigint) {
    const requests = await this.prisma.fingerRelation.findMany({
      where: {
        targetUserId: ownerUserId,
        deletedAt: null,
        ownerUser: {
          deletedAt: null,
          status: 'ACTIVE',
        },
      },
      include: {
        ownerUser: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    const filteredRequests = [];
    for (const relation of requests) {
      const isMutual = await this.fingersPolicy.isMutual(
        ownerUserId,
        relation.ownerUserId,
      );

      if (!isMutual) {
        filteredRequests.push(relation);
      }
    }

    return {
      count: filteredRequests.length,
      items: filteredRequests.map((relation) => ({
        relationId: relation.id,
        user: {
          ...relation.ownerUser,
          profile: relation.ownerUser.profile
            ? {
                ...relation.ownerUser.profile,
                profileImageLayout: {
                  focusX: relation.ownerUser.profile.profileImageFocusX,
                  focusY: relation.ownerUser.profile.profileImageFocusY,
                  scale: relation.ownerUser.profile.profileImageScale,
                },
              }
            : null,
        },
        createdAt: relation.createdAt,
      })),
    };
  }

  async addFinger(ownerUserId: bigint, targetUserId: bigint) {
    this.fingersPolicy.validateNotSelf(ownerUserId, targetUserId);

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        username: true,
        profile: {
          select: {
            displayName: true,
          },
        },
      },
    });

    if (!targetUser) {
      throw new NotFoundException('target user not found');
    }

    const existingActive = await this.prisma.fingerRelation.findFirst({
      where: {
        ownerUserId,
        targetUserId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (existingActive) {
      throw new ConflictException('already fingered');
    }

    const canAdd = await this.fingersPolicy.canAddFinger(ownerUserId);
    if (!canAdd) {
      throw new BadRequestException('finger limit exceeded');
    }

    const relation = await this.prisma.$transaction(async (tx) => {
      const existingSoftDeleted = await tx.fingerRelation.findFirst({
        where: {
          ownerUserId,
          targetUserId,
          deletedAt: {
            not: null,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
        },
      });

      if (existingSoftDeleted) {
        return tx.fingerRelation.update({
          where: {
            id: existingSoftDeleted.id,
          },
          data: {
            deletedAt: null,
          },
        });
      }

      return tx.fingerRelation.create({
        data: {
          ownerUserId,
          targetUserId,
        },
      });
    });

    const isMutual = await this.fingersPolicy.isMutual(ownerUserId, targetUserId);

    if (isMutual) {
      const ownerUser = await this.prisma.user.findUnique({
        where: { id: ownerUserId },
        select: {
          id: true,
          username: true,
          profile: {
            select: {
              displayName: true,
            },
          },
        },
      });

      const ownerLabel =
        ownerUser?.profile?.displayName || ownerUser?.username || '상대';
      const targetLabel =
        targetUser.profile?.displayName || targetUser.username || '상대';

      await Promise.all([
        this.notificationsService.create({
          recipientUserId: ownerUserId,
          actorUserId: targetUserId,
          type: 'FINGER_MUTUAL',
          title: '새 핑거',
          body: `${targetLabel}님과 서로 핑거가 됐어요.`,
          linkPath: '/dashboard/fingers',
        }),
        this.notificationsService.create({
          recipientUserId: targetUserId,
          actorUserId: ownerUserId,
          type: 'FINGER_MUTUAL',
          title: '새 핑거',
          body: `${ownerLabel}님과 서로 핑거가 됐어요.`,
          linkPath: '/dashboard/fingers',
        }),
      ]);
    }

    return {
      relationId: relation.id,
      ownerUserId: relation.ownerUserId,
      targetUserId: relation.targetUserId,
      createdAt: relation.createdAt,
      isMutual,
      status: isMutual ? 'MUTUAL' : 'PENDING',
    };
  }

  async removeFinger(ownerUserId: bigint, targetUserId: bigint) {
    const activeRelations = await this.prisma.fingerRelation.findMany({
      where: {
        OR: [
          {
            ownerUserId,
            targetUserId,
          },
          {
            ownerUserId: targetUserId,
            targetUserId: ownerUserId,
          },
        ],
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (activeRelations.length === 0) {
      throw new NotFoundException('finger relation not found');
    }

    await this.prisma.fingerRelation.updateMany({
      where: {
        id: {
          in: activeRelations.map((relation) => relation.id),
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.deactivateRoomIfMutualBroken(ownerUserId, targetUserId);

    return {
      removed: true,
      targetUserId,
    };
  }

  async acceptFingerRequest(ownerUserId: bigint, requesterUserId: bigint) {
    this.fingersPolicy.validateNotSelf(ownerUserId, requesterUserId);

    const existingRequest = await this.prisma.fingerRelation.findFirst({
      where: {
        ownerUserId: requesterUserId,
        targetUserId: ownerUserId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingRequest) {
      throw new NotFoundException('finger request not found');
    }

    return this.addFinger(ownerUserId, requesterUserId);
  }

  async rejectFingerRequest(ownerUserId: bigint, requesterUserId: bigint) {
    this.fingersPolicy.validateNotSelf(ownerUserId, requesterUserId);

    const existingRequest = await this.prisma.fingerRelation.findFirst({
      where: {
        ownerUserId: requesterUserId,
        targetUserId: ownerUserId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existingRequest) {
      throw new NotFoundException('finger request not found');
    }

    await this.prisma.fingerRelation.update({
      where: {
        id: existingRequest.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      rejected: true,
      userId: requesterUserId,
    };
  }

  async isMutual(ownerUserId: bigint, otherUserId: bigint) {
    this.fingersPolicy.validateNotSelf(ownerUserId, otherUserId);

    const isMutual = await this.fingersPolicy.isMutual(ownerUserId, otherUserId);

    return {
      userId: otherUserId,
      isMutual,
    };
  }

  private async deactivateRoomIfMutualBroken(userA: bigint, userB: bigint) {
    const stillMutual = await this.fingersPolicy.isMutual(userA, userB);
    if (stillMutual) {
      return;
    }

    const { user1Id, user2Id } = normalizeUserPair(userA, userB);

    await this.prisma.messageRoom.updateMany({
      where: {
        user1Id,
        user2Id,
        status: 'ACTIVE',
      },
      data: {
        status: 'INACTIVE',
        deactivatedAt: new Date(),
      },
    });
  }
}
