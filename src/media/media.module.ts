import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaPolicy } from './media.policy';
import { MediaService } from './media.service';
import { S3StorageService } from './storage/s3-storage.service';
import { StorageService } from './storage/storage.service';

@Module({
  imports: [AuthModule, ConfigModule],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaPolicy,
    S3StorageService,
    {
      provide: StorageService,
      useExisting: S3StorageService,
    },
  ],
  exports: [MediaService],
})
export class MediaModule {}
