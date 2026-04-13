import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaService } from '../../media/media.service';

@Injectable()
export class MediaResolverService {
  constructor(
    private readonly mediaService: MediaService,
    private readonly configService: ConfigService,
  ) {}

  async resolveByVisibility(params: {
    objectKey: string | null | undefined;
    visibility: 'PUBLIC' | 'PRIVATE';
  }): Promise<string | null> {
    const { objectKey, visibility } = params;

    if (!objectKey) {
      return null;
    }

    const resolved = await this.mediaService.resolveReadUrl({
      objectKey,
      visibility,
    });

    return resolved.url;
  }

  async resolveManyByVisibility(params: {
    objectKeys: Array<string | null | undefined>;
    visibility: 'PUBLIC' | 'PRIVATE';
  }): Promise<(string | null)[]> {
    const { objectKeys, visibility } = params;

    return Promise.all(
      objectKeys.map((objectKey) =>
        this.resolveByVisibility({ objectKey, visibility }),
      ),
    );
  }

  async resolveProfileImageUrl(
    profileImageUrl: string | null | undefined,
  ): Promise<string | null> {
    if (!profileImageUrl) {
      return null;
    }

    return this.resolveByVisibility({
      objectKey: this.extractObjectKey(profileImageUrl),
      visibility: 'PRIVATE',
    });
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
