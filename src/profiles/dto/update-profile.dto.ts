import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ProfileImageLayoutDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  focusX!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  focusY!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(3)
  scale!: number;
}

export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @MaxLength(20)
  @Matches(/^[a-z0-9]+$/, {
    message: 'displayName must contain only lowercase letters and numbers with no spaces',
  })
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  bio?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileImageLayoutDto)
  profileImageLayout?: ProfileImageLayoutDto;
}
