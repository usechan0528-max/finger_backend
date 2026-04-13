import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { MediaResolverService } from '../common/mappers/media-resolver.service';
import { PostResponseMapper } from '../common/mappers/post-response.mapper';
import { FingersPolicy } from '../fingers/fingers.policy';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { PostsPolicy } from './posts.policy';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postsPolicy: PostsPolicy,
    private readonly postResponseMapper: PostResponseMapper,
    private readonly mediaResolverService: MediaResolverService,
    private readonly fingersPolicy: FingersPolicy,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async mapCommentAuthor(comment: {
    author: {
      id: bigint;
      username: string;
      profile: {
        displayName: string | null;
        profileImageUrl: string | null;
        profileImageFocusX: number;
        profileImageFocusY: number;
        profileImageScale: number;
        isInfluencerMode: boolean;
      } | null;
    } | null;
  }) {
    if (!comment.author) return null;

    return {
      id: comment.author.id,
      username: comment.author.username,
      profile: comment.author.profile
        ? {
            displayName: comment.author.profile.displayName,
            profileImageUrl:
              await this.mediaResolverService.resolveProfileImageUrl(
                comment.author.profile.profileImageUrl,
              ),
            profileImageLayout: {
              focusX: comment.author.profile.profileImageFocusX,
              focusY: comment.author.profile.profileImageFocusY,
              scale: comment.author.profile.profileImageScale,
            },
            isInfluencerMode: comment.author.profile.isInfluencerMode,
          }
        : null,
    };
  }

  private async mapCommentTree(
    comments: Array<{
      id: bigint;
      postId: bigint;
      authorUserId: bigint;
      parentCommentId: bigint | null;
      body: string;
      createdAt: Date;
      author: {
        id: bigint;
        username: string;
        profile: {
          displayName: string | null;
          profileImageUrl: string | null;
          profileImageFocusX: number;
          profileImageFocusY: number;
          profileImageScale: number;
          isInfluencerMode: boolean;
        } | null;
      } | null;
      replies?: Array<{
        id: bigint;
        postId: bigint;
        authorUserId: bigint;
        parentCommentId: bigint | null;
        body: string;
        createdAt: Date;
        author: {
          id: bigint;
          username: string;
          profile: {
            displayName: string | null;
            profileImageUrl: string | null;
            profileImageFocusX: number;
            profileImageFocusY: number;
            profileImageScale: number;
            isInfluencerMode: boolean;
          } | null;
        } | null;
      }>;
    }>,
  ) {
    return Promise.all(
      comments.map(async (comment) => ({
        id: comment.id,
        postId: comment.postId,
        authorUserId: comment.authorUserId,
        parentCommentId: comment.parentCommentId,
        body: comment.body,
        createdAt: comment.createdAt,
        author: await this.mapCommentAuthor(comment),
        replies: comment.replies
          ? await Promise.all(
              comment.replies.map(async (reply) => ({
                id: reply.id,
                postId: reply.postId,
                authorUserId: reply.authorUserId,
                parentCommentId: reply.parentCommentId,
                body: reply.body,
                createdAt: reply.createdAt,
                author: await this.mapCommentAuthor(reply),
              })),
            )
          : [],
      })),
    );
  }

  async createPost(authorUserId: bigint, dto: CreatePostDto) {
    const trimmedContent =
      typeof dto.contentText === 'string' ? dto.contentText.trim() : '';

    const hasText = trimmedContent.length > 0;
    const hasMedia = Array.isArray(dto.media) && dto.media.length > 0;

    if (!hasText && !hasMedia) {
      throw new BadRequestException('post must contain text or media');
    }

    const post = await this.prisma.post.create({
      data: {
        authorUserId,
        contentText: hasText ? trimmedContent : null,
        visibilityType: 'FINGER_ONLY',
        mediaAssets: hasMedia
          ? {
              create: dto.media!.map((media, index) => ({
                mediaObjectKey: media.objectKey,
                mediaType: media.type,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        mediaAssets: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
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

    return this.postResponseMapper.map(post);
  }

  async getPostDetail(viewerUserId: bigint, postId: bigint) {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      include: {
        mediaAssets: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
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
        comments: {
          where: {
            deletedAt: null,
            parentCommentId: null,
          },
          orderBy: {
            createdAt: 'asc',
          },
          include: {
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
            replies: {
              where: {
                deletedAt: null,
              },
              orderBy: {
                createdAt: 'asc',
              },
              include: {
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
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('post not found');
    }

    const allowed = await this.postsPolicy.canViewPost(viewerUserId, postId);

    if (!allowed) {
      throw new ForbiddenException('cannot view this post');
    }

    const commentsVisible =
      post.authorUserId === viewerUserId ||
      (await this.fingersPolicy.isMutual(viewerUserId, post.authorUserId));

    const mapped = await this.postResponseMapper.map(post);

    return {
      ...mapped,
      canComment: commentsVisible,
      comments: commentsVisible
        ? await this.mapCommentTree(post.comments ?? [])
        : [],
    };
  }

  async createPostComment(
    requestUserId: bigint,
    postId: bigint,
    dto: CreatePostCommentDto,
  ) {
    const trimmedBody = dto.body.trim();

    if (!trimmedBody) {
      throw new BadRequestException('comment body must not be empty');
    }

    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
        authorUserId: true,
      },
    });

    if (!post) {
      throw new NotFoundException('post not found');
    }

    const canComment =
      post.authorUserId === requestUserId ||
      (await this.fingersPolicy.isMutual(requestUserId, post.authorUserId));

    if (!canComment) {
      throw new ForbiddenException('cannot comment on this post');
    }

    let parentCommentId: bigint | null = null;
    if (dto.parentCommentId) {
      parentCommentId = BigInt(dto.parentCommentId);

      const parentComment = await this.prisma.postComment.findFirst({
        where: {
          id: parentCommentId,
          postId,
          deletedAt: null,
        },
        select: {
          id: true,
          authorUserId: true,
        },
      });

      if (!parentComment) {
        throw new NotFoundException('parent comment not found');
      }
    }

    const comment = await this.prisma.postComment.create({
      data: {
        postId,
        authorUserId: requestUserId,
        parentCommentId,
        body: trimmedBody,
      },
      include: {
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

    if (post.authorUserId !== requestUserId) {
      await this.notificationsService.create({
        recipientUserId: post.authorUserId,
        actorUserId: requestUserId,
        type: 'COMMENT',
        title: parentCommentId ? '새 답글' : '새 댓글',
        body: trimmedBody.length > 80 ? `${trimmedBody.slice(0, 80)}…` : trimmedBody,
        linkPath: `/dashboard/posts/${postId.toString()}?focus=comments`,
      });
    }

    if (parentCommentId) {
      const parentComment = await this.prisma.postComment.findUnique({
        where: {
          id: parentCommentId,
        },
        select: {
          authorUserId: true,
        },
      });

      if (
        parentComment?.authorUserId &&
        parentComment.authorUserId !== requestUserId &&
        parentComment.authorUserId !== post.authorUserId
      ) {
        await this.notificationsService.create({
          recipientUserId: parentComment.authorUserId,
          actorUserId: requestUserId,
          type: 'COMMENT',
          title: '새 답글',
          body: trimmedBody.length > 80 ? `${trimmedBody.slice(0, 80)}…` : trimmedBody,
          linkPath: `/dashboard/posts/${postId.toString()}?focus=comments`,
        });
      }
    }

    return {
      id: comment.id,
      postId: comment.postId,
      authorUserId: comment.authorUserId,
      parentCommentId: comment.parentCommentId,
      body: comment.body,
      createdAt: comment.createdAt,
      author: await this.mapCommentAuthor(comment),
      replies: [],
    };
  }

  async deletePost(requestUserId: bigint, postId: bigint) {
    const existing = await this.prisma.post.findFirst({
      where: {
        id: postId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('post not found');
    }

    const allowed = await this.postsPolicy.canDeletePost(requestUserId, postId);

    if (!allowed) {
      throw new ForbiddenException('cannot delete this post');
    }

    await this.prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return {
      deleted: true,
      postId,
    };
  }

  async getFeed(viewerUserId: bigint, query: FeedQueryDto) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor ? BigInt(query.cursor) : null;

    const items = await this.prisma.post.findMany({
      where: {
        deletedAt: null,
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
        mediaAssets: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
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
    const mapped = await this.postResponseMapper.mapMany(sliced);

    return {
      items: mapped,
      pageInfo: {
        hasNext,
        nextCursor,
      },
    };
  }

  async getMyPosts(userId: bigint, query: FeedQueryDto) {
    return this.getUserPosts(userId, userId, query);
  }

  async getMyAlbum(userId: bigint, query: FeedQueryDto) {
    const limit = query.limit ?? 30;
    const cursor = query.cursor ? BigInt(query.cursor) : null;

    const posts = await this.prisma.post.findMany({
      where: {
        deletedAt: null,
        mediaAssets: {
          some: {},
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
            authorUserId: userId,
          },
          {
            author: {
              ownedFingers: {
                some: {
                  targetUserId: userId,
                  deletedAt: null,
                },
              },
              targetedFingers: {
                some: {
                  ownerUserId: userId,
                  deletedAt: null,
                },
              },
            },
          },
        ],
      },
      include: {
        mediaAssets: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
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

    const hasNext = posts.length > limit;
    const sliced = hasNext ? posts.slice(0, limit) : posts;
    const nextCursor = hasNext ? sliced[sliced.length - 1].id : null;
    const mapped = await this.postResponseMapper.mapMany(sliced);

    return {
      items: mapped,
      pageInfo: {
        hasNext,
        nextCursor,
      },
    };
  }

  async getUserPosts(
    viewerUserId: bigint,
    targetUserId: bigint,
    query: FeedQueryDto,
  ) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor ? BigInt(query.cursor) : null;

    const posts = await this.prisma.post.findMany({
      where: {
        authorUserId: targetUserId,
        deletedAt: null,
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
        mediaAssets: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
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

    const hasNext = posts.length > limit;
    const sliced = hasNext ? posts.slice(0, limit) : posts;
    const nextCursor = hasNext ? sliced[sliced.length - 1].id : null;
    const mapped = await this.postResponseMapper.mapMany(sliced);

    return {
      items: mapped,
      pageInfo: {
        hasNext,
        nextCursor,
      },
    };
  }
}
