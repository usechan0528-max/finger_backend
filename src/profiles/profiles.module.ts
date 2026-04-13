import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesPolicy } from './profiles.policy';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesPolicy],
  exports: [ProfilesService, ProfilesPolicy],
})
export class ProfilesModule {}
