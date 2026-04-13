import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostCommentDto {
  @ApiProperty({ example: '이 사진 좋네요.' })
  @IsString()
  @MaxLength(500)
  body: string;

  @ApiPropertyOptional({ example: '12', description: '답글을 달 대상 댓글 id' })
  @IsOptional()
  @Type(() => String)
  parentCommentId?: string;
}
