import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { SearchProfilesQueryDto } from './dto/search-profiles-query.dto';
import { UpdateInfluencerModeDto } from './dto/update-influencer-mode.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('Profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @ApiOperation({ summary: '내 프로필 조회' })
  @Get('me')
  async getMyProfile(@CurrentUser() user: AuthUser) {
    return this.profilesService.getMyProfile(BigInt(user.userId));
  }

  @ApiOperation({ summary: '사용자 이름 사용 가능 여부 확인' })
  @Get('check-display-name')
  async checkDisplayName(
    @CurrentUser() user: AuthUser,
    @Query('displayName') displayName?: string,
  ) {
    return this.profilesService.checkDisplayNameAvailability(
      BigInt(user.userId),
      displayName,
    );
  }

  @ApiOperation({ summary: '내 프로필 수정' })
  @Patch('me')
  async updateMyProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateMyProfile(BigInt(user.userId), dto);
  }

  @ApiOperation({ summary: '인플루언서 모드 변경' })
  @Patch('me/influencer-mode')
  async updateInfluencerMode(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateInfluencerModeDto,
  ) {
    return this.profilesService.updateInfluencerMode(BigInt(user.userId), dto);
  }

  @ApiOperation({ summary: '유저 프로필 조회' })
  @Get(':userId')
  async getProfileForViewer(
    @CurrentUser() user: AuthUser,
    @Param('userId', ParseBigIntPipe) userId: bigint,
  ) {
    return this.profilesService.getProfileForViewer(
      BigInt(user.userId),
      userId,
    );
  }

  @ApiOperation({ summary: '사용자 이름 기반 프로필 검색' })
  @Get()
  async searchProfiles(
    @CurrentUser() user: AuthUser,
    @Query() query: SearchProfilesQueryDto,
  ) {
    return this.profilesService.searchProfiles(
      BigInt(user.userId),
      query.q,
    );
  }
}
