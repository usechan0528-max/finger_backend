import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateStoryMediaDto {
  @ApiProperty({ example: 'stories/123/2026/04/uuid.jpg' })
  @IsString()
  objectKey: string;

  @ApiProperty({ enum: ['IMAGE', 'VIDEO'] })
  @IsEnum(['IMAGE', 'VIDEO'])
  type: 'IMAGE' | 'VIDEO';
}

export class CreateStoryDto {
  @ApiPropertyOptional({ example: '오늘의 스토리' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  contentText?: string;

  @ApiProperty({ enum: ['FINGER_ONLY', 'PUBLIC'] })
  @IsEnum(['FINGER_ONLY', 'PUBLIC'])
  visibilityType: 'FINGER_ONLY' | 'PUBLIC';

  @ApiPropertyOptional({ type: [CreateStoryMediaDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateStoryMediaDto)
  media?: CreateStoryMediaDto[];
}
