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
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';
import { PostsService } from './posts.service';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: '게시물 생성' })
  @Post('posts')
  async createPost(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.createPost(BigInt(user.userId), dto);
  }

  @ApiOperation({ summary: '내 게시물 목록 조회' })
  @Get('posts/me')
  async getMyPosts(
    @CurrentUser() user: AuthUser,
    @Query() query: FeedQueryDto,
  ) {
    return this.postsService.getMyPosts(BigInt(user.userId), query);
  }

  @ApiOperation({ summary: '내 앨범 조회' })
  @Get('posts/album/me')
  async getMyAlbum(
    @CurrentUser() user: AuthUser,
    @Query() query: FeedQueryDto,
  ) {
    return this.postsService.getMyAlbum(BigInt(user.userId), query);
  }

  @ApiOperation({ summary: '게시물 상세 조회' })
  @Get('posts/:postId')
  async getPostDetail(
    @CurrentUser() user: AuthUser,
    @Param('postId', ParseBigIntPipe) postId: bigint,
  ) {
    return this.postsService.getPostDetail(BigInt(user.userId), postId);
  }

  @ApiOperation({ summary: '게시물 댓글 작성' })
  @Post('posts/:postId/comments')
  async createPostComment(
    @CurrentUser() user: AuthUser,
    @Param('postId', ParseBigIntPipe) postId: bigint,
    @Body() dto: CreatePostCommentDto,
  ) {
    return this.postsService.createPostComment(BigInt(user.userId), postId, dto);
  }

  @ApiOperation({ summary: '게시물 삭제' })
  @Delete('posts/:postId')
  async deletePost(
    @CurrentUser() user: AuthUser,
    @Param('postId', ParseBigIntPipe) postId: bigint,
  ) {
    return this.postsService.deletePost(BigInt(user.userId), postId);
  }

  @ApiOperation({ summary: '내 피드 조회' })
  @Get('feed')
  async getFeed(
    @CurrentUser() user: AuthUser,
    @Query() query: FeedQueryDto,
  ) {
    return this.postsService.getFeed(BigInt(user.userId), query);
  }

  @ApiOperation({ summary: '특정 유저 게시물 목록 조회' })
  @Get('users/:userId/posts')
  async getUserPosts(
    @CurrentUser() user: AuthUser,
    @Param('userId', ParseBigIntPipe) targetUserId: bigint,
    @Query() query: FeedQueryDto,
  ) {
    return this.postsService.getUserPosts(
      BigInt(user.userId),
      targetUserId,
      query,
    );
  }
}
