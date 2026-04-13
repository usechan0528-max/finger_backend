export type PresignedUploadResult = {
  objectKey: string;
  uploadUrl: string;
  publicUrl: string | null;
  expiresIn: number;
};

export abstract class StorageService {
  abstract createPresignedUploadUrl(params: {
    objectKey: string;
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
