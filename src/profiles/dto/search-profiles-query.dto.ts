import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchProfilesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  q?: string;
}
