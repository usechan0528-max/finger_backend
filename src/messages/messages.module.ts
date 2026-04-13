import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MappersModule } from '../common/mappers/mappers.module';
import { MessageRoomsModule } from '../message-rooms/message-rooms.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { MessagesPolicy } from './messages.policy';
import { MessagesService } from './messages.service';

@Module({
  imports: [AuthModule, MessageRoomsModule, MappersModule, NotificationsModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesPolicy, MessagesGateway],
  exports: [MessagesService, MessagesPolicy],
})
export class MessagesModule {}
