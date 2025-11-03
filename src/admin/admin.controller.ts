import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../user/models/user.entity';
import { CreateUserDto } from '../user/dto/create_user.dto';
import { UserResponseDto } from '../user/dto/user_response.dto';

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
  async createAdmin(@Body() bodyData: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, confirmPassword } = bodyData;
    return this.adminService.create(email, password, confirmPassword);
  }
}
