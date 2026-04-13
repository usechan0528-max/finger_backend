import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma/prisma.service';
import { FindUsernameDto } from './dto/find-username.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  private readonly presignClient: S3Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const region = this.configService.get<string>('AWS_REGION');
    const endpoint =
      this.configService.get<string>('AWS_S3_PRESIGN_ENDPOINT') ||
      this.configService.get<string>('AWS_S3_ENDPOINT');
    const forcePathStyle =
      this.configService.get<string>('AWS_S3_FORCE_PATH_STYLE') === 'true';

    this.presignClient = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  async checkUsernameAvailability(rawUsername?: string) {
    const username = (rawUsername ?? '').trim().toLowerCase();

    if (!username) {
      return {
        available: false,
        normalized: '',
      };
    }

    const exists = await this.prisma.user.findFirst({
      where: {
        username,
        deletedAt: null,
      },
      select: { id: true },
    });

    return {
      available: !exists,
      normalized: username,
    };
  }

  async checkDisplayNameAvailability(rawDisplayName?: string) {
    const displayName = (rawDisplayName ?? '').trim().toLowerCase();

    if (!displayName) {
      return {
        available: false,
        normalized: '',
      };
    }

    const exists = await this.prisma.profile.findFirst({
      where: {
        displayName,
      },
      select: { userId: true },
    });

    return {
      available: !exists,
      normalized: displayName,
    };
  }

  async signup(dto: SignupDto) {
    const normalizedUsername = dto.username.trim().toLowerCase();
    const normalizedDisplayName = dto.displayName.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: normalizedUsername }],
        deletedAt: null,
      },
      select: { email: true, username: true },
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('email already in use');
      }
      throw new ConflictException('username already in use');
    }

    const existingDisplayName = await this.prisma.profile.findFirst({
      where: {
        displayName: normalizedDisplayName,
      },
      select: { userId: true },
    });

    if (existingDisplayName) {
      throw new ConflictException('display name already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: normalizedUsername,
        password: hashedPassword,
        profile: {
          create: {
            displayName: normalizedDisplayName,
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id.toString(),
    });

    return { user, accessToken };
  }

  async findUsername(dto: FindUsernameDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        deletedAt: null,
      },
      select: {
        username: true,
      },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return {
      username: user.username,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const normalizedUsername = dto.username.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        username: normalizedUsername,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    return {
      success: true,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('invalid credentials');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id.toString(),
    });

    return {
      user: { id: user.id, email: user.email, username: user.username },
      accessToken,
    };
  }

  async me(userId: bigint) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        profile: {
          select: {
            displayName: true,
            profileImageUrl: true,
            profileImageFocusX: true,
            profileImageFocusY: true,
            profileImageScale: true,
            isInfluencerMode: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return {
      ...user,
      profile: user.profile
        ? {
            ...user.profile,
            profileImageUrl: await this.resolveProfileImageUrl(
              user.profile.profileImageUrl,
            ),
            profileImageLayout: {
              focusX: user.profile.profileImageFocusX,
              focusY: user.profile.profileImageFocusY,
              scale: user.profile.profileImageScale,
            },
          }
        : null,
    };
  }

  private async resolveProfileImageUrl(
    profileImageUrl: string | null,
  ): Promise<string | null> {
    if (!profileImageUrl) {
      return null;
    }

    const objectKey = this.extractObjectKey(profileImageUrl);
    const ttl =
      Number(this.configService.get<string>('AWS_S3_PRIVATE_URL_TTL_SECONDS')) ||
      300;
    const bucket = this.configService.get<string>('AWS_S3_BUCKET');

    if (!bucket) {
      return profileImageUrl;
    }

    return getSignedUrl(
      this.presignClient,
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey.replace(/^\/+/, ''),
      }),
      {
        expiresIn: ttl,
      },
    );
  }

  private extractObjectKey(profileImageUrl: string): string {
    if (!/^https?:\/\//i.test(profileImageUrl)) {
      return profileImageUrl;
    }

    const publicBaseUrl = this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL');

    if (!publicBaseUrl) {
      return profileImageUrl;
    }

    return (
      this.rewriteLegacyPublicUrl(profileImageUrl, publicBaseUrl) || profileImageUrl
    );
  }

  private rewriteLegacyPublicUrl(
    profileImageUrl: string,
    publicBaseUrl: string,
  ): string | null {
    try {
      const currentBase = new URL(publicBaseUrl);
      const legacyUrl = new URL(profileImageUrl);
      const bucketPrefix = `${currentBase.pathname.replace(/\/+$/, '')}/`;

      if (!legacyUrl.pathname.startsWith(bucketPrefix)) {
        return null;
      }

      return legacyUrl.pathname.slice(bucketPrefix.length).replace(/^\/+/, '');
    } catch {
      return null;
    }
  }
}
