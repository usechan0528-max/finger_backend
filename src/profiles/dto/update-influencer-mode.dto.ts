import { IsBoolean } from 'class-validator';

export class UpdateInfluencerModeDto {
  @IsBoolean()
  enabled: boolean;
}
