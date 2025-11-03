import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

import { LocalAuthGuard } from './guards/local_auth.guard';
import { CurrentUser } from './current_user.decorator';
import { User } from '../user/models/user.entity';
import express from 'express';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    await this.authService.login(user, response);
  }

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
  async loginAdmin(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    await this.authService.login(user, response);
  }
}
