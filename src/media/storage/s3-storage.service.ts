import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PresignedUploadResult, StorageService } from './storage.service';

@Injectable()
export class S3StorageService extends StorageService {
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly client: S3Client;
  private readonly presignClient: S3Client;

  constructor(private readonly configService: ConfigService) {
    super();

    const region = this.configService.get<string>('AWS_REGION');
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');
    const publicBaseUrl = this.configService.get<string>(
      'AWS_S3_PUBLIC_BASE_URL',
    );
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    const presignEndpoint =
      this.configService.get<string>('AWS_S3_PRESIGN_ENDPOINT') || endpoint;
    const forcePathStyle =
      this.configService.get<string>('AWS_S3_FORCE_PATH_STYLE') === 'true';

    if (!region || !bucket) {
      throw new Error('S3 configuration is incomplete');
    }

    this.bucket = bucket;
    this.publicBaseUrl =
      publicBaseUrl || `https://${bucket}.s3.${region}.amazonaws.com`;

    const credentials = {
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
      secretAccessKey:
        this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
    };

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle,
      credentials,
    });

    this.presignClient = new S3Client({
      region,
      endpoint: presignEndpoint || undefined,
      forcePathStyle,
      credentials,
    });
  }

  async createPresignedUploadUrl(params: {
    objectKey: string;
    contentType: string;
    isPublic: boolean;
    expiresInSeconds: number;
  }): Promise<PresignedUploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.objectKey,
      ContentType: params.contentType,
    });

    const uploadUrl = await getSignedUrl(this.presignClient, command, {
      expiresIn: params.expiresInSeconds,
    });

    return {
      objectKey: params.objectKey,
      uploadUrl,
      publicUrl: params.isPublic ? this.getPublicUrl(params.objectKey) : null,
      expiresIn: params.expiresInSeconds,
    };
  }

  getPublicUrl(objectKey: string): string {
    return `${this.publicBaseUrl}/${objectKey}`;
  }

  async createSignedReadUrl(params: {
    objectKey: string;
    expiresInSeconds: number;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: params.objectKey,
    });

    return getSignedUrl(this.presignClient, command, {
      expiresIn: params.expiresInSeconds,
    });
  }
}
