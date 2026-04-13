import { Module } from '@nestjs/common';
import { MediaModule } from '../../media/media.module';
import { MediaResolverService } from './media-resolver.service';
import { MessageResponseMapper } from './message-response.mapper';
import { PostResponseMapper } from './post-response.mapper';
import { StoryResponseMapper } from './story-response.mapper';

@Module({
  imports: [MediaModule],
  providers: [
    MediaResolverService,
    PostResponseMapper,
    StoryResponseMapper,
    MessageResponseMapper,
  ],
  exports: [
    MediaResolverService,
    PostResponseMapper,
    StoryResponseMapper,
    MessageResponseMapper,
  ],
})
export class MappersModule {}
