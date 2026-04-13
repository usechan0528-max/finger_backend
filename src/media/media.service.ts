import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { ResolveMediaUrlDto } from './dto/resolve-media-url.dto';
import { MediaPolicy } from './media.policy';
import { StorageService } from './storage/storage.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaPolicy: MediaPolicy,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  async createUploadUrl(userId: bigint, dto: CreateUploadUrlDto) {
    this.mediaPolicy.validateMimeType({
      mediaType: dto.mediaType,
      mimeType: dto.mimeType,
    });

    const visibility = this.mediaPolicy.resolveVisibility({
      purpose: dto.purpose,
      requestedVisibility: dto.visibility,
    });
    const objectKey = this.buildObjectKey({
      userId,
      purpose: dto.purpose,
      originalFileName: dto.originalFileName,
    });

    const expiresInSeconds = 300;

    return this.storageService.createPresignedUploadUrl({
      objectKey,
      mediaType: dto.mediaType,
      contentType: dto.mimeType,
      isPublic: visibility === 'PUBLIC',
      expiresInSeconds,
    });
  }

  async resolveReadUrl(dto: ResolveMediaUrlDto) {
    if (/^https?:\/\//i.test(dto.objectKey)) {
      return {
        url: dto.objectKey,
        expiresIn: null,
      };
    }

    if (dto.visibility === 'PUBLIC') {
      return {
        url: this.storageService.getPublicUrl(dto.objectKey),
        expiresIn: null,
      };
    }

    const ttl =
      Number(this.configService.get<string>('AWS_S3_PRIVATE_URL_TTL_SECONDS')) ||
      300;

    const url = await this.storageService.createSignedReadUrl({
      objectKey: dto.objectKey,
      expiresInSeconds: ttl,
    });

    return {
      url,
      expiresIn: ttl,
    };
  }

  private buildObjectKey(params: {
    userId: bigint;
    purpose: 'POST' | 'STORY' | 'MESSAGE' | 'PROFILE';
    originalFileName: string;
  }): string {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');

    const prefixMap = {
      POST: 'posts',
      STORY: 'stories',
      MESSAGE: 'messages',
      PROFILE: 'profiles',
    } as const;

    const prefix = prefixMap[params.purpose];
    const ext = this.extractExtension(params.originalFileName);
    const fileName = ext ? `${randomUUID()}.${ext}` : randomUUID();

    return `${prefix}/${params.userId.toString()}/${yyyy}/${mm}/${fileName}`;
  }

  private extractExtension(fileName: string): string | null {
    const cleaned = fileName.trim();
    const lastDot = cleaned.lastIndexOf('.');

    if (lastDot <= 0 || lastDot === cleaned.length - 1) {
      return null;
    }

    return cleaned.slice(lastDot + 1).toLowerCase();
  }
}
