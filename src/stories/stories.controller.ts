import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { CreateStoryDto } from './dto/create-story.dto';
import { StoryFeedQueryDto } from './dto/story-feed-query.dto';
import { StoriesService } from './stories.service';

@ApiTags('Stories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @ApiOperation({ summary: '스토리 생성' })
  @Post('stories')
  async createStory(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateStoryDto,
  ) {
    return this.storiesService.createStory(BigInt(user.userId), dto);
  }

  @ApiOperation({ summary: '스토리 피드 조회' })
  @Get('stories/feed')
  async getStoryFeed(
    @CurrentUser() user: AuthUser,
    @Query() query: StoryFeedQueryDto,
  ) {
    return this.storiesService.getStoryFeed(BigInt(user.userId), query);
  }

  @ApiOperation({ summary: '스토리 상세 조회' })
  @Get('stories/:storyId')
  async getStoryDetail(
    @CurrentUser() user: AuthUser,
    @Param('storyId', ParseBigIntPipe) storyId: bigint,
  ) {
    return this.storiesService.getStoryDetail(BigInt(user.userId), storyId);
  }

  @ApiOperation({ summary: '스토리 삭제' })
  @Delete('stories/:storyId')
  async deleteStory(
    @CurrentUser() user: AuthUser,
    @Param('storyId', ParseBigIntPipe) storyId: bigint,
  ) {
    return this.storiesService.deleteStory(BigInt(user.userId), storyId);
  }

  @ApiOperation({ summary: '특정 유저 스토리 목록 조회' })
  @Get('users/:userId/stories')
  async getUserStories(
    @CurrentUser() user: AuthUser,
    @Param('userId', ParseBigIntPipe) targetUserId: bigint,
    @Query() query: StoryFeedQueryDto,
  ) {
    return this.storiesService.getUserStories(
      BigInt(user.userId),
      targetUserId,
      query,
    );
  }
}
