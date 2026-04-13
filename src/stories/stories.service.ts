import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { StoryResponseMapper } from '../common/mappers/story-response.mapper';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryFeedQueryDto } from './dto/story-feed-query.dto';
import { StoriesPolicy } from './stories.policy';

@Injectable()
export class StoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storiesPolicy: StoriesPolicy,
    private readonly storyResponseMapper: StoryResponseMapper,
  ) {}

  async createStory(authorUserId: bigint, dto: CreateStoryDto) {
    const trimmedContent =
      typeof dto.contentText === 'string' ? dto.contentText.trim() : '';

    const hasText = trimmedContent.length > 0;
    const hasMedia = Array.isArray(dto.media) && dto.media.length > 0;

    if (!hasText && !hasMedia) {
      throw new BadRequestException('story must contain text or media');
    }

    if (Array.isArray(dto.media) && dto.media.length > 1) {
      throw new BadRequestException('story can contain only one media item');
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const story = await this.prisma.story.create({
      data: {
        authorUserId,
        contentText: hasText ? trimmedContent : null,
        visibilityType: dto.visibilityType,
        expiresAt,
        mediaAssets: hasMedia
          ? {
              create: dto.media!.map((media) => ({
                mediaObjectKey: media.objectKey,
                mediaType: media.type,
              })),
            }
          : undefined,
      },
      include: {
        mediaAssets: true,
        author: {
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
        },
      },
    });

    return this.storyResponseMapper.map(story);
  }

  async getStoryDetail(viewerUserId: bigint, storyId: bigint) {
    const story = await this.prisma.story.findFirst({
      where: {
        id: storyId,
        deletedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        mediaAssets: true,
        author: {
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
        },
      },
    });

    if (!story) {
      throw new NotFoundException('story not found');
    }

    const allowed = await this.storiesPolicy.canViewStory(viewerUserId, storyId);

    if (!allowed) {
      throw new ForbiddenException('cannot view this story');
    }

    return this.storyResponseMapper.map(story);
  }

  async deleteStory(requestUserId: bigint, storyId: bigint) {
    const existing = await this.prisma.story.findFirst({
      where: {
        id: storyId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('story not found');
    }

    const allowed = await this.storiesPolicy.canDeleteStory(
      requestUserId,
      storyId,
    );

    if (!allowed) {
      throw new ForbiddenException('cannot delete this story');
    }

    await this.prisma.story.update({
      where: {
        id: storyId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      deleted: true,
      storyId,
    };
  }

  async getStoryFeed(viewerUserId: bigint, query: StoryFeedQueryDto) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor ? BigInt(query.cursor) : null;
    const now = new Date();

    const items = await this.prisma.story.findMany({
      where: {
        deletedAt: null,
        expiresAt: {
          gt: now,
        },
        ...(cursor
          ? {
              id: {
                lt: cursor,
              },
            }
          : {}),
        OR: [
          {
            authorUserId: viewerUserId,
          },
          {
            visibilityType: 'PUBLIC',
          },
          {
            author: {
              ownedFingers: {
                some: {
                  targetUserId: viewerUserId,
                  deletedAt: null,
                },
              },
              targetedFingers: {
                some: {
                  ownerUserId: viewerUserId,
                  deletedAt: null,
                },
              },
            },
          },
        ],
      },
      include: {
        mediaAssets: true,
        author: {
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
        },
      },
      orderBy: {
        id: 'desc',
      },
      take: limit + 1,
    });

    const hasNext = items.length > limit;
    const sliced = hasNext ? items.slice(0, limit) : items;
    const nextCursor = hasNext ? sliced[sliced.length - 1].id : null;
    const mapped = await this.storyResponseMapper.mapMany(sliced);

    return {
      items: mapped,
      pageInfo: {
        hasNext,
        nextCursor,
      },
    };
  }

  async getUserStories(
    viewerUserId: bigint,
    targetUserId: bigint,
    query: StoryFeedQueryDto,
  ) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor ? BigInt(query.cursor) : null;
    const now = new Date();

    const items = await this.prisma.story.findMany({
      where: {
        authorUserId: targetUserId,
        deletedAt: null,
        expiresAt: {
          gt: now,
        },
        ...(cursor
          ? {
              id: {
                lt: cursor,
              },
            }
          : {}),
        OR: [
          {
            authorUserId: viewerUserId,
          },
          {
            visibilityType: 'PUBLIC',
          },
          {
            author: {
              ownedFingers: {
                some: {
                  targetUserId: viewerUserId,
                  deletedAt: null,
                },
              },
              targetedFingers: {
                some: {
                  ownerUserId: viewerUserId,
                  deletedAt: null,
                },
              },
            },
          },
        ],
      },
      include: {
        mediaAssets: true,
        author: {
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
        },
      },
      orderBy: {
        id: 'desc',
      },
      take: limit + 1,
    });

    const hasNext = items.length > limit;
    const sliced = hasNext ? items.slice(0, limit) : items;
    const nextCursor = hasNext ? sliced[sliced.length - 1].id : null;
    const mapped = await this.storyResponseMapper.mapMany(sliced);

    return {
      items: mapped,
      pageInfo: {
        hasNext,
        nextCursor,
      },
    };
  }
}
