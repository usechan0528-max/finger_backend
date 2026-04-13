import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PresignedUploadResult, StorageService } from './storage.service';

@Injectable()
export class CloudinaryStorageService extends StorageService {
  private readonly cloudName: string;
  private readonly uploadPreset: string;

  constructor(private readonly configService: ConfigService) {
    super();

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const uploadPreset = this.configService.get<string>('CLOUDINARY_UPLOAD_PRESET');

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is incomplete');
    }

    this.cloudName = cloudName;
    this.uploadPreset = uploadPreset;
  }

  async createPresignedUploadUrl(params: {
    objectKey: string;
    mediaType: 'IMAGE' | 'VIDEO';
    contentType: string;
    isPublic: boolean;
    expiresInSeconds: number;
  }): Promise<PresignedUploadResult> {
    const resourceType = params.mediaType === 'VIDEO' ? 'video' : 'image';
    const publicId = this.normalizePublicId(params.objectKey);
    const publicUrl = this.buildDeliveryUrl(resourceType, publicId);

    return {
      objectKey: publicUrl,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`,
      publicUrl,
      expiresIn: params.expiresInSeconds,
      uploadMethod: 'POST_FORM',
      uploadFields: {
        upload_preset: this.uploadPreset,
        public_id: publicId,
        resource_type: resourceType,
      },
    };
  }

  getPublicUrl(objectKey: string): string {
    if (/^https?:\/\//i.test(objectKey)) {
      return objectKey;
    }

    const publicId = this.normalizePublicId(objectKey);
    return this.buildDeliveryUrl('image', publicId);
  }

  async createSignedReadUrl(params: {
    objectKey: string;
    expiresInSeconds: number;
  }): Promise<string> {
    return this.getPublicUrl(params.objectKey);
  }

  private normalizePublicId(objectKey: string): string {
    return objectKey
      .replace(/^https?:\/\/[^/]+\//i, '')
      .replace(/\.[a-z0-9]+$/i, '');
  }

  private buildDeliveryUrl(resourceType: 'image' | 'video', publicId: string): string {
    return `https://res.cloudinary.com/${this.cloudName}/${resourceType}/upload/${publicId}`;
  }
}
