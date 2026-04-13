import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MappersModule } from '../common/mappers/mappers.module';
import { StoriesController } from './stories.controller';
import { StoriesPolicy } from './stories.policy';
import { StoriesService } from './stories.service';

@Module({
  imports: [AuthModule, MappersModule],
  controllers: [StoriesController],
  providers: [StoriesService, StoriesPolicy],
  exports: [StoriesService, StoriesPolicy],
})
export class StoriesModule {}
