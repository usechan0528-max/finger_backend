import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class ResolveMediaUrlDto {
  @ApiProperty()
  @IsString()
  objectKey: string;

  @ApiProperty({ enum: ['PUBLIC', 'PRIVATE'] })
  @IsEnum(['PUBLIC', 'PRIVATE'])
  visibility: 'PUBLIC' | 'PRIVATE';
}
