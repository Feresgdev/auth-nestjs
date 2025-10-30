import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FindByRoleDto {
  @ApiProperty({ description: 'Role name to filter users' })
  @IsString()
  roleName: string;
}
