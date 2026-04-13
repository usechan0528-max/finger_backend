import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MappersModule } from '../common/mappers/mappers.module';
import { FingersModule } from '../fingers/fingers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PostsController } from './posts.controller';
import { PostsPolicy } from './posts.policy';
import { PostsService } from './posts.service';

@Module({
  imports: [AuthModule, MappersModule, FingersModule, NotificationsModule],
  controllers: [PostsController],
  providers: [PostsService, PostsPolicy],
  exports: [PostsService, PostsPolicy],
})
export class PostsModule {}
