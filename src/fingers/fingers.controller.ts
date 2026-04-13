import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { FingersService } from './fingers.service';

@ApiTags('Fingers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('fingers')
export class FingersController {
  constructor(private readonly fingersService: FingersService) {}

  @ApiOperation({ summary: '내 핑거 목록 조회' })
  @Get('me')
  async getMyFingers(@CurrentUser() user: AuthUser) {
    return this.fingersService.getMyFingers(BigInt(user.userId));
  }

  @ApiOperation({ summary: '내가 받은 핑거 요청 조회' })
  @Get('requests/me')
  async getMyPendingRequests(@CurrentUser() user: AuthUser) {
    return this.fingersService.getMyPendingRequests(BigInt(user.userId));
  }

  @ApiOperation({ summary: '핑거 추가' })
  @Post(':targetUserId')
  async addFinger(
    @CurrentUser() user: AuthUser,
    @Param('targetUserId', ParseBigIntPipe) targetUserId: bigint,
  ) {
    return this.fingersService.addFinger(BigInt(user.userId), targetUserId);
  }

  @ApiOperation({ summary: '핑거 제거' })
  @Delete(':targetUserId')
  async removeFinger(
    @CurrentUser() user: AuthUser,
    @Param('targetUserId', ParseBigIntPipe) targetUserId: bigint,
  ) {
    return this.fingersService.removeFinger(BigInt(user.userId), targetUserId);
  }

  @ApiOperation({ summary: '핑거 요청 수락' })
  @Post('requests/:requesterUserId/accept')
  async acceptFingerRequest(
    @CurrentUser() user: AuthUser,
    @Param('requesterUserId', ParseBigIntPipe) requesterUserId: bigint,
  ) {
    return this.fingersService.acceptFingerRequest(
      BigInt(user.userId),
      requesterUserId,
    );
  }

  @ApiOperation({ summary: '핑거 요청 거절' })
  @Delete('requests/:requesterUserId')
  async rejectFingerRequest(
    @CurrentUser() user: AuthUser,
    @Param('requesterUserId', ParseBigIntPipe) requesterUserId: bigint,
  ) {
    return this.fingersService.rejectFingerRequest(
      BigInt(user.userId),
      requesterUserId,
    );
  }

  @ApiOperation({ summary: '상호 핑거 여부 조회' })
  @Get('mutual/:userId')
  async isMutual(
    @CurrentUser() user: AuthUser,
    @Param('userId', ParseBigIntPipe) otherUserId: bigint,
  ) {
    return this.fingersService.isMutual(BigInt(user.userId), otherUserId);
  }
}
