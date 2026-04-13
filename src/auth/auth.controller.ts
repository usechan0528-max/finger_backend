import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { FindUsernameDto } from './dto/find-username.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('Auth')
@UseGuards(JwtAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiOperation({ summary: '아이디 사용 가능 여부 확인' })
  @Get('check-username')
  async checkUsername(@Query('username') username?: string) {
    return this.authService.checkUsernameAvailability(username);
  }

  @Public()
  @ApiOperation({ summary: '사용자 이름 사용 가능 여부 확인' })
  @Get('check-display-name')
  async checkDisplayName(@Query('displayName') displayName?: string) {
    return this.authService.checkDisplayNameAvailability(displayName);
  }

  @Public()
  @ApiOperation({ summary: '회원가입' })
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Public()
  @ApiOperation({ summary: '아이디 찾기' })
  @Post('find-username')
  async findUsername(@Body() dto: FindUsernameDto) {
    return this.authService.findUsername(dto);
  }

  @Public()
  @ApiOperation({ summary: '비밀번호 재설정' })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Public()
  @ApiOperation({ summary: '로그인' })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '내 인증 정보 조회' })
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.me(BigInt(user.userId));
  }
}
