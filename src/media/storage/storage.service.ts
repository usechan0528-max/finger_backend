export type PresignedUploadResult = {
  objectKey: string;
  uploadUrl: string;
  publicUrl: string | null;
  expiresIn: number;
  uploadMethod?: 'PUT' | 'POST_FORM';
  uploadFields?: Record<string, string>;
};

export abstract class StorageService {
  abstract createPresignedUploadUrl(params: {
    objectKey: string;
    mediaType: 'IMAGE' | 'VIDEO';
    contentType: string;
    isPublic: boolean;
    expiresInSeconds: number;
  }): Promise<PresignedUploadResult>;

  abstract getPublicUrl(objectKey: string): string;

  abstract createSignedReadUrl(params: {
    objectKey: string;
    expiresInSeconds: number;
  }): Promise<string>;
}
