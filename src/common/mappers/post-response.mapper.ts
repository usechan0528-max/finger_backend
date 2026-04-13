import { Injectable } from '@nestjs/common';
import { MediaResolverService } from './media-resolver.service';

@Injectable()
export class PostResponseMapper {
  constructor(private readonly mediaResolverService: MediaResolverService) {}

  async map(post: {
    id: bigint;
    authorUserId: bigint;
    contentText: string | null;
    visibilityType: string;
    createdAt: Date;
    updatedAt: Date;
    author?: {
      id: bigint;
      username: string;
      profile: {
        displayName: string;
        profileImageUrl: string | null;
        profileImageFocusX: number;
        profileImageFocusY: number;
        profileImageScale: number;
        isInfluencerMode: boolean;
      } | null;
    } | null;
    mediaAssets?: Array<{
      id: bigint;
      mediaObjectKey: string;
      mediaType: string;
      sortOrder: number;
    }>;
  }) {
    const mediaVisibility =
      post.visibilityType === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE';

    const media = await Promise.all(
      (post.mediaAssets ?? []).map(async (asset) => ({
        id: asset.id,
        type: asset.mediaType,
        objectKey: asset.mediaObjectKey,
        url: await this.mediaResolverService.resolveByVisibility({
          objectKey: asset.mediaObjectKey,
          visibility: mediaVisibility,
        }),
        sortOrder: asset.sortOrder,
      })),
    );

    return {
      id: post.id,
      authorUserId: post.authorUserId,
      contentText: post.contentText,
      visibilityType: post.visibilityType,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: post.author
        ? {
            id: post.author.id,
            username: post.author.username,
            profile: post.author.profile
              ? {
                  displayName: post.author.profile.displayName,
                  profileImageUrl:
                    await this.mediaResolverService.resolveProfileImageUrl(
                      post.author.profile.profileImageUrl,
                    ),
                  profileImageLayout: {
                    focusX: post.author.profile.profileImageFocusX,
                    focusY: post.author.profile.profileImageFocusY,
                    scale: post.author.profile.profileImageScale,
                  },
                  isInfluencerMode: post.author.profile.isInfluencerMode,
                }
              : null,
          }
        : null,
      media,
    };
  }

  async mapMany(posts: Array<{
    id: bigint;
    authorUserId: bigint;
    contentText: string | null;
    visibilityType: string;
    createdAt: Date;
    updatedAt: Date;
    author?: {
      id: bigint;
      username: string;
        profile: {
          displayName: string;
          profileImageUrl: string | null;
          profileImageFocusX: number;
          profileImageFocusY: number;
          profileImageScale: number;
          isInfluencerMode: boolean;
        } | null;
    } | null;
    mediaAssets?: Array<{
      id: bigint;
      mediaObjectKey: string;
      mediaType: string;
      sortOrder: number;
    }>;
  }>) {
    return Promise.all(posts.map((post) => this.map(post)));
  }
}
