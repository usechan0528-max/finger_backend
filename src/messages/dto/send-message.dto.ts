import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ enum: ['TEXT', 'IMAGE'] })
  @IsEnum(['TEXT', 'IMAGE'])
  type: 'TEXT' | 'IMAGE';

  @ApiPropertyOptional({ example: '안녕' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;

  @ApiPropertyOptional({ example: 'messages/123/2026/04/uuid.jpg' })
  @IsOptional()
  @IsString()
  attachmentObjectKey?: string;
}
