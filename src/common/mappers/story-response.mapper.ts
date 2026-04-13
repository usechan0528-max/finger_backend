import { Injectable } from '@nestjs/common';
import { MediaResolverService } from './media-resolver.service';

@Injectable()
export class StoryResponseMapper {
  constructor(private readonly mediaResolverService: MediaResolverService) {}

  async map(story: {
    id: bigint;
    authorUserId: bigint;
    contentText: string | null;
    visibilityType: string;
    expiresAt: Date;
    createdAt: Date;
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
    }>;
  }) {
    const mediaVisibility =
      story.visibilityType === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE';

    const media = await Promise.all(
      (story.mediaAssets ?? []).map(async (asset) => ({
        id: asset.id,
        type: asset.mediaType,
        objectKey: asset.mediaObjectKey,
        url: await this.mediaResolverService.resolveByVisibility({
          objectKey: asset.mediaObjectKey,
          visibility: mediaVisibility,
        }),
      })),
    );

    return {
      id: story.id,
      authorUserId: story.authorUserId,
      contentText: story.contentText,
      visibilityType: story.visibilityType,
      expiresAt: story.expiresAt,
      createdAt: story.createdAt,
      author: story.author
        ? {
            id: story.author.id,
            username: story.author.username,
            profile: story.author.profile
              ? {
                  displayName: story.author.profile.displayName,
                  profileImageUrl:
                    await this.mediaResolverService.resolveProfileImageUrl(
                      story.author.profile.profileImageUrl,
                    ),
                  profileImageLayout: {
                    focusX: story.author.profile.profileImageFocusX,
                    focusY: story.author.profile.profileImageFocusY,
                    scale: story.author.profile.profileImageScale,
                  },
                  isInfluencerMode: story.author.profile.isInfluencerMode,
                }
              : null,
          }
        : null,
      media,
    };
  }

  async mapMany(
    stories: Array<{
      id: bigint;
      authorUserId: bigint;
      contentText: string | null;
      visibilityType: string;
      expiresAt: Date;
      createdAt: Date;
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
      }>;
    }>,
  ) {
    return Promise.all(stories.map((story) => this.map(story)));
  }
}
