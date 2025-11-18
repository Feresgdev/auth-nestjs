import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @Optional()
  email?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Profile picture file',
  })
  @Optional()
  profilePicFile?: any;
}
