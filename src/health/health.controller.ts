import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: '헬스 체크' })
  @Get()
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: '라이브니스 체크' })
  @Get('live')
  live() {
    return {
      status: 'ok',
      live: true,
      timestamp: new Date().toISOString(),
    };
  }

  @ApiOperation({ summary: '레디니스 체크' })
  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }
}
