import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from './models/user.entity';
import { FindAllUsersDto } from './dto/find-all-users.dto';
import { CreateUserDto } from './dto/create_user.dto';
import { UserResponseDto } from './dto/user_response.dto';
import { isEmail } from 'class-validator';
import { EmailParamDto } from './dto/email_param.dto';
import { UpdateUserDto } from './dto/update_user.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Get('')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  async findAllUsers(@Query() query: FindAllUsersDto) {
    return this.userService.findAll(query.page, query.limit);
  }

  @Public()
  @Get('/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  async findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<User> {
    return this.userService.findById(id);
  }

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a regular user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Email already exists or invalid data',
  })
  async createUser(@Body() bodyData: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, confirmPassword } = bodyData;
    return this.userService.create(email, password, confirmPassword);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiOperation({ summary: 'Update a regular user' })
  @ApiResponse({
    status: 200,
    description: 'User data updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'User already restored or not even deleted',
  })
  async updatedUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() bodyData: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, bodyData);
  }

  @Patch('restore/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiOperation({ summary: 'Resotre a regular user' })
  @ApiResponse({
    status: 204,
    description: 'User restored successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'User already restored or not even deleted',
  })
  async restoreUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.userService.restore(id);
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiOperation({ summary: 'Soft delete a regular user' })
  @ApiResponse({
    status: 204,
    description: 'User restored successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'user already deleted!',
  })
  async softDeleteUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.userService.softDelete(id);
  }

  @Delete('/:id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'User id' })
  @ApiOperation({ summary: 'Hard delete a regular user' })
  @ApiResponse({
    status: 204,
    description: 'User hard deleted successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'user already deleted!',
  })
  async deleteUser(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.userService.softDelete(id);
  }
}
