import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaPolicy } from './media.policy';
import { MediaService } from './media.service';
import { CloudinaryStorageService } from './storage/cloudinary-storage.service';
import { S3StorageService } from './storage/s3-storage.service';
import { StorageService } from './storage/storage.service';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaPolicy,
    S3StorageService,
    CloudinaryStorageService,
    {
      provide: StorageService,
      useFactory: (
        s3StorageService: S3StorageService,
        cloudinaryStorageService: CloudinaryStorageService,
      ) => {
        const provider = process.env.STORAGE_PROVIDER?.toLowerCase();
        return provider === 'cloudinary'
          ? cloudinaryStorageService
          : s3StorageService;
      },
      inject: [S3StorageService, CloudinaryStorageService],
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
