import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'fingeruser' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-z0-9]+$/, {
    message: 'username can only contain lowercase letters and numbers',
  })
  username: string;

  @ApiProperty({ example: 'Finger1234!', minLength: 12, maxLength: 25 })
  @IsString()
  @Length(12, 25)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
    message:
      'password must include uppercase letters, lowercase letters, numbers, and special characters',
  })
  newPassword: string;
}
