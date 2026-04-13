import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { ResolveMediaUrlDto } from './dto/resolve-media-url.dto';
import { MediaService } from './media.service';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @ApiOperation({ summary: '업로드용 presigned URL 발급' })
  @Post('upload-url')
  async createUploadUrl(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateUploadUrlDto,
  ) {
    return this.mediaService.createUploadUrl(BigInt(user.userId), dto);
  }

  @ApiOperation({ summary: '읽기용 URL 해석(public 또는 signed)' })
  @Post('resolve-url')
  async resolveUrl(@Body() dto: ResolveMediaUrlDto) {
    return this.mediaService.resolveReadUrl(dto);
  }
}
