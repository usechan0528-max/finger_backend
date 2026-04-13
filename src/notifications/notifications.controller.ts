import { Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: '최근 알림 조회' })
  @Get()
  async listRecent(
    @CurrentUser() user: AuthUser,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationsService.listRecent(BigInt(user.userId), query.limit);
  }

  @ApiOperation({ summary: '읽지 않은 알림 수 조회' })
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    return this.notificationsService.getUnreadCount(BigInt(user.userId));
  }

  @ApiOperation({ summary: '알림 전체 읽음 처리' })
  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: AuthUser) {
    return this.notificationsService.markAllAsRead(BigInt(user.userId));
  }
}
