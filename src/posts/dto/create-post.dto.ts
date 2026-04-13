import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class CreatePostMediaDto {
  @ApiProperty({ example: 'posts/123/2026/04/uuid.jpg' })
  @IsString()
  objectKey: string;

  @ApiProperty({ enum: ['IMAGE', 'VIDEO'] })
  @IsEnum(['IMAGE', 'VIDEO'])
  type: 'IMAGE' | 'VIDEO';
}

export class CreatePostDto {
  @ApiPropertyOptional({ example: '본문 내용' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  contentText?: string;

  @ApiProperty({ enum: ['FINGER_ONLY'] })
  @IsEnum(['FINGER_ONLY'])
  visibilityType: 'FINGER_ONLY';

  @ApiPropertyOptional({ type: [CreatePostMediaDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreatePostMediaDto)
  media?: CreatePostMediaDto[];
}
