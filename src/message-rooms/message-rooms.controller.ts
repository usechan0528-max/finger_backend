import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { MessageRoomsService } from './message-rooms.service';

@ApiTags('Message Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('message-rooms')
export class MessageRoomsController {
  constructor(private readonly messageRoomsService: MessageRoomsService) {}

  @ApiOperation({ summary: '메시지방 생성 또는 조회' })
  @Post(':userId')
  async createOrGetRoom(
    @CurrentUser() user: AuthUser,
    @Param('userId', ParseBigIntPipe) otherUserId: bigint,
  ) {
    return this.messageRoomsService.createOrGetRoom(
      BigInt(user.userId),
      otherUserId,
    );
  }

  @ApiOperation({ summary: '내 메시지방 목록 조회' })
  @Get()
  async getMyRooms(@CurrentUser() user: AuthUser) {
    return this.messageRoomsService.getMyRooms(BigInt(user.userId));
  }

  @ApiOperation({ summary: '메시지방 상세 조회' })
  @Get(':roomId')
  async getRoom(
    @CurrentUser() user: AuthUser,
    @Param('roomId', ParseBigIntPipe) roomId: bigint,
  ) {
    return this.messageRoomsService.getRoomOrFail(
      BigInt(user.userId),
      roomId,
    );
  }
}
