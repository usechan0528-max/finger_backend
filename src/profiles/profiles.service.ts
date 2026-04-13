import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma/prisma.service';
import { MediaService } from '../media/media.service';
import { UpdateInfluencerModeDto } from './dto/update-influencer-mode.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesPolicy } from './profiles.policy';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesPolicy: ProfilesPolicy,
    private readonly mediaService: MediaService,
    private readonly configService: ConfigService,
  ) {}

  async getMyProfile(userId: bigint) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: {
        userId: true,
        displayName: true,
        bio: true,
        profileImageUrl: true,
        profileImageFocusX: true,
        profileImageFocusY: true,
        profileImageScale: true,
        isInfluencerMode: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            status: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('profile not found');
    }

    return {
      accessLevel: 'SELF',
      canMessage: false,
      profile: await this.mapOwnProfile(profile),
    };
  }

  async checkDisplayNameAvailability(userId: bigint, rawDisplayName?: string) {
    const displayName = (rawDisplayName ?? '').trim().toLowerCase();

    if (!displayName) {
      return {
        available: false,
        normalized: '',
      };
    }

    const existing = await this.prisma.profile.findFirst({
      where: {
        userId: {
          not: userId,
        },
        displayName,
        user: {
          deletedAt: null,
          status: 'ACTIVE',
        },
      },
      select: { userId: true },
    });

    return {
      available: !existing,
      normalized: displayName,
    };
  }

  async updateMyProfile(userId: bigint, dto: UpdateProfileDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (!existing) {
      throw new NotFoundException('profile not found');
    }

    const data: Record<string, string | number | null> = {};

    if (typeof dto.displayName === 'string') {
      const normalizedDisplayName = dto.displayName.trim().toLowerCase();
      const duplicated = await this.prisma.profile.findFirst({
        where: {
          userId: {
            not: userId,
          },
          displayName: normalizedDisplayName,
          user: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        },
        select: { userId: true },
      });

      if (duplicated) {
        throw new ConflictException('display name already in use');
      }

      data.displayName = normalizedDisplayName;
    }

    if (typeof dto.bio === 'string') {
      data.bio = dto.bio.trim();
    }

    if (typeof dto.profileImageUrl === 'string') {
      data.profileImageUrl = dto.profileImageUrl.trim();
    }

    if (dto.profileImageLayout) {
      data.profileImageFocusX = dto.profileImageLayout.focusX;
      data.profileImageFocusY = dto.profileImageLayout.focusY;
      data.profileImageScale = dto.profileImageLayout.scale;
    }

    const updated = await this.prisma.profile.update({
      where: { userId },
      data,
      select: {
        userId: true,
        displayName: true,
        bio: true,
        profileImageUrl: true,
        profileImageFocusX: true,
        profileImageFocusY: true,
        profileImageScale: true,
        isInfluencerMode: true,
        updatedAt: true,
      },
    });

    return {
      ...updated,
      profileImageUrl: await this.resolveProfileImageUrl(updated.profileImageUrl),
      profileImageLayout: this.mapProfileImageLayout(updated),
    };
  }

  async updateInfluencerMode(userId: bigint, dto: UpdateInfluencerModeDto) {
    const existing = await this.prisma.profile.findUnique({
      where: { userId },
      select: { userId: true },
    });

    if (!existing) {
      throw new NotFoundException('profile not found');
    }

    const updated = await this.prisma.profile.update({
      where: { userId },
      data: {
        isInfluencerMode: dto.enabled,
      },
      select: {
        userId: true,
        displayName: true,
        isInfluencerMode: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async getProfileForViewer(viewerUserId: bigint, targetUserId: bigint) {
    const user = await this.prisma.user.findFirst({
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
            userId: true,
            displayName: true,
            bio: true,
            profileImageUrl: true,
            profileImageFocusX: true,
            profileImageFocusY: true,
            profileImageScale: true,
            isInfluencerMode: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user || !user.profile) {
      throw new NotFoundException('profile not found');
    }

    const accessLevel = await this.profilesPolicy.getAccessLevel(
      viewerUserId,
      targetUserId,
    );

    if (accessLevel === 'LIMITED') {
      return {
        accessLevel,
        canMessage: false,
        profile: {
          userId: user.id,
          username: user.username,
          displayName: user.profile.displayName,
          profileImageUrl: await this.resolveProfileImageUrl(
            user.profile.profileImageUrl,
          ),
          profileImageLayout: this.mapProfileImageLayout(user.profile),
        },
      };
    }

    const canMessage =
      viewerUserId === targetUserId
        ? false
        : await this.profilesPolicy.isMutualFinger(viewerUserId, targetUserId);

    return {
      accessLevel,
      canMessage,
      profile: {
        userId: user.id,
        username: user.username,
        displayName: user.profile.displayName,
        bio: user.profile.bio,
        profileImageUrl: await this.resolveProfileImageUrl(
          user.profile.profileImageUrl,
        ),
        profileImageLayout: this.mapProfileImageLayout(user.profile),
        isInfluencerMode: user.profile.isInfluencerMode,
        createdAt: user.profile.createdAt,
        updatedAt: user.profile.updatedAt,
      },
    };
  }

  async searchProfiles(viewerUserId: bigint, rawQuery?: string) {
    const normalizedQuery = (rawQuery ?? '').trim().replace(/^@+/, '');

    if (!normalizedQuery) {
      return {
        items: [],
      };
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          not: viewerUserId,
        },
        deletedAt: null,
        status: 'ACTIVE',
        profile: {
          displayName: {
            contains: normalizedQuery,
            mode: 'insensitive',
          },
        },
      },
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
            isInfluencerMode: true,
          },
        },
      },
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      items: await Promise.all(
        users.map(async (user) => ({
          ...user,
          profile: user.profile
              ? {
                  ...user.profile,
                  profileImageUrl: await this.resolveProfileImageUrl(
                    user.profile.profileImageUrl,
                  ),
                  profileImageLayout: this.mapProfileImageLayout(user.profile),
                }
              : null,
        })),
      ),
    };
  }

  private async mapOwnProfile(profile: {
    userId: bigint;
    displayName: string;
    bio: string | null;
    profileImageUrl: string | null;
    profileImageFocusX: number;
    profileImageFocusY: number;
    profileImageScale: number;
    isInfluencerMode: boolean;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: bigint;
      email: string;
      username: string;
      status: string;
    };
  }) {
    return {
      ...profile,
      profileImageUrl: await this.resolveProfileImageUrl(profile.profileImageUrl),
      profileImageLayout: this.mapProfileImageLayout(profile),
    };
  }

  private mapProfileImageLayout(profile: {
    profileImageFocusX: number;
    profileImageFocusY: number;
    profileImageScale: number;
  }) {
    return {
      focusX: profile.profileImageFocusX,
      focusY: profile.profileImageFocusY,
      scale: profile.profileImageScale,
    };
  }

  private async resolveProfileImageUrl(
    profileImageUrl: string | null,
  ): Promise<string | null> {
    if (!profileImageUrl) {
      return null;
    }

    const objectKey = this.extractObjectKey(profileImageUrl);

    const resolved = await this.mediaService.resolveReadUrl({
      objectKey,
      visibility: 'PRIVATE',
    });

    return resolved.url;
  }

  private extractObjectKey(profileImageUrl: string): string {
    if (!/^https?:\/\//i.test(profileImageUrl)) {
      return profileImageUrl;
    }

    const rewritten = this.rewriteLegacyPublicUrl(profileImageUrl);
    return rewritten || profileImageUrl;
  }

  private rewriteLegacyPublicUrl(profileImageUrl: string): string | null {
    const publicBaseUrl = this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL');

    if (!publicBaseUrl) {
      return null;
    }

    try {
      const currentBase = new URL(publicBaseUrl);
      const legacyUrl = new URL(profileImageUrl);
      const bucketPrefix = `${currentBase.pathname.replace(/\/+$/, '')}/`;

      if (!legacyUrl.pathname.startsWith(bucketPrefix)) {
        return null;
      }

      return legacyUrl.pathname.slice(bucketPrefix.length).replace(/^\/+/, '');
    } catch {
      return null;
    }
  }
}
