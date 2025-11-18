import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { LocalAuthGuard } from './guards/local_auth.guard';
import { CurrentUser } from './current_user.decorator';
import { User } from '../user/models/user.entity';
import express from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Public } from './public.decorator';
import { ResetPasswordDto } from './dto/reset_password.dto';
import { JwtAuthGuard } from './guards/jwt.auth.guard';
import { CreateUserDto } from '../user/dto/create_user.dto';
import { UserResponseDto } from '../user/dto/user_response.dto';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Public()
  @Post('/login/local')
  @UseGuards(LocalAuthGuard)
  @ApiOperation({
    summary: 'User Login',
    description: 'Authenticates a user using email/username and password',
  })
  @ApiBody({
    description: 'User login credentials',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'john.doe@example.com' },
        password: { type: 'string', example: 'Password123!' },
      },
      required: ['email', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful. Cookies/session token set.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async loginUser(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    console.log('test login controller : ', user);
    await this.authService.login(user, response);
  }

  @Post('/logout')
  @ApiOperation({ summary: 'User Logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    return this.authService.logout(user.id, response);
  }

  @Public()
  @Post('register')
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

  @Post('/activate')
  @ApiOperation({ summary: 'Activate Account' })
  @ApiQuery({ name: 'token', type: 'string' })
  async activateAccount(@Query('token') token: string) {
    return this.authService.activateAccount(token);
  }

  @Post('/resend-activation-email')
  @ApiOperation({
    summary: 'Resend Activation Email ',
    description: 'Sends a new activation email using email address',
  })
  @ApiBody({
    description: 'User id',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: '1684ff64-b517-48ce-80b9-c0c5bf18feda',
        },
      },
      required: ['id'],
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'If the email exists and is not activated, an email will be sent',
  })
  async resendActivationEmailPublic(@Body('id') id: string) {
    return this.authService.sendActivationToken(id);
  }

  @Public()
  @Post('/forgot-password')
  @ApiOperation({ summary: 'Request Password Reset' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'john.doe@example.com' },
      },
    },
  })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Post('/reset-password')
  @ApiOperation({ summary: 'Reset Password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: { type: 'string', example: 'NewPassword123!' },
      },
    },
  })
  @ApiQuery({ name: 'token', type: 'string' })
  async resetPassword(
    @Query('token') token: string,
    @Body() resetDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(token, resetDto.password);
  }
}
