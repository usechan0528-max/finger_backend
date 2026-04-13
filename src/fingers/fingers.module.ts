import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FingersController } from './fingers.controller';
import { FingersPolicy } from './fingers.policy';
import { FingersService } from './fingers.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [FingersController],
  providers: [FingersService, FingersPolicy],
  exports: [FingersService, FingersPolicy],
})
export class FingersModule {}
