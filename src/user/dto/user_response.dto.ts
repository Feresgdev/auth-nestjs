import { ApiProperty } from '@nestjs/swagger';

type roleType = {
  name: string;
};

export class UserResponseDto {
  @ApiProperty({ example: '37a30057-1907-401e-854e-f4228eb484b5' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: '30/10/2025 16:21' })
  createdAt: Date;

  @ApiProperty({ example: '30/10/2025 16:21' })
  updatedAt: Date;

  @ApiProperty({ example: 'USER' })
  role: roleType;
}
