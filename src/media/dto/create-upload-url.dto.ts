import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class CreateUploadUrlDto {
  @ApiProperty({ enum: ['POST', 'STORY', 'MESSAGE', 'PROFILE'] })
  @IsEnum(['POST', 'STORY', 'MESSAGE', 'PROFILE'])
  purpose: 'POST' | 'STORY' | 'MESSAGE' | 'PROFILE';

  @ApiProperty({ enum: ['IMAGE', 'VIDEO'] })
  @IsEnum(['IMAGE', 'VIDEO'])
  mediaType: 'IMAGE' | 'VIDEO';

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @Matches(/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/)
  mimeType: string;

  @ApiProperty({ example: 'photo.jpg' })
  @IsString()
  originalFileName: string;

  @ApiProperty({ required: false, enum: ['PUBLIC', 'PRIVATE'] })
  @IsOptional()
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PRIVATE';
}
