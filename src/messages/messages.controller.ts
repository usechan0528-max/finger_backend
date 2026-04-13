import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('message-rooms/:roomId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: '메시지 목록 조회' })
  @Get()
  async getMessages(
    @CurrentUser() user: AuthUser,
    @Param('roomId', ParseBigIntPipe) roomId: bigint,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit?: number,
  ) {
    return this.messagesService.getMessages(
      BigInt(user.userId),
      roomId,
      cursor,
      limit,
    );
  }

  @ApiOperation({ summary: '메시지 전송' })
  @Post()
  async sendMessage(
    @CurrentUser() user: AuthUser,
    @Param('roomId', ParseBigIntPipe) roomId: bigint,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(
      BigInt(user.userId),
      roomId,
      dto,
    );
  }
}
