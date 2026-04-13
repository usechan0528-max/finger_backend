import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MappersModule } from '../common/mappers/mappers.module';
import { MessageRoomsController } from './message-rooms.controller';
import { MessageRoomsPolicy } from './message-rooms.policy';
import { MessageRoomsService } from './message-rooms.service';

@Module({
  imports: [AuthModule, MappersModule],
  controllers: [MessageRoomsController],
  providers: [MessageRoomsService, MessageRoomsPolicy],
  exports: [MessageRoomsService, MessageRoomsPolicy],
})
export class MessageRoomsModule {}
