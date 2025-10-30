import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { FindAllUsersDto } from 'src/user/dto/find-all-users.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from 'src/user/models/user.entity';
import { CreateUserDto } from 'src/user/dto/create_user.dto';
import { UserResponseDto } from 'src/user/dto/user_response.dto';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an admin user' })
  @ApiResponse({
    status: 201,
    description: 'Admin created successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Email already exists or invalid data',
  })
  async createAdmin(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.adminService.create(dto);
  }
}
