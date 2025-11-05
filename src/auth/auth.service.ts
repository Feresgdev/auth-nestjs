import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { User } from '../user/models/user.entity';
import { compare } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './token_payload.interface';
import { Response } from 'express';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async login(user: User, response: Response) {
    const expiresAcessToken = new Date();
    expiresAcessToken.setMilliseconds(
      expiresAcessToken.getTime() +
        parseInt(
          this.configService.getOrThrow<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION_MS',
          ),
        ),
    );

    const expiresRefreshToken = new Date();
    expiresRefreshToken.setMilliseconds(
      expiresRefreshToken.getTime() +
        parseInt(
          this.configService.getOrThrow<string>(
            'JWT_REFRESH_TOKEN_EXPIRATION_MS',
          ),
        ),
    );

    const tokenPayload: TokenPayload = {
      userId: user.id,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow(
        'JWT_ACCESS_TOKEN_EXPIRATION_MS',
      )}ms`,
    });

    const refreshToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow(
        'JWT_REFRESH_TOKEN_EXPIRATION_MS',
      )}ms`,
    });

    await this.userService.updateRefreshToken(user.id, refreshToken);

    response.cookie('Authentification', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: expiresAcessToken,
    });
    response.cookie('Refresh', refreshToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: expiresRefreshToken,
    });
  }

  async logout(userId: string, response: Response) {
    await this.userService.updateRefreshToken(userId, null);

    response.clearCookie('Authentification');
    response.clearCookie('Refresh');

    return { message: 'Logged out successfully' };
  }

  async sendActivationToken(userId: string): Promise<{ message: string }> {
    const user: User = await this.userService.findById(userId);

    const activationToken = randomBytes(32).toString('hex');

    await this.userService.updateActivationToken(user.id, activationToken);

    await this.emailService.sendActivationEmail(user.email, activationToken);

    return { message: 'An email has been sent to activate your account!' };
  }

  async activateAccount(token: string) {
    const user = await this.userService.findByActivationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    await this.userService.activateUser(user.id);

    return { message: 'Account activated successfully. You can now login.' };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await this.userService.createPasswordResetToken(
      user.id,
      resetToken,
      resetTokenExpiry,
    );

    await this.emailService.sendPasswordResetEmail(email, resetToken);

    return {
      message:
        'If your email is registered, you will receive a password reset link.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userService.findByResetToken(token);

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.userService.updatePasswordAndResetToken(user.id, hashedPassword);

    return {
      message:
        'Password reset successfully. You can now login with your new password.',
    };
  }

  async varifyUser(email: string, password: string): Promise<User> {
    try {
      const foundUser: User = await this.userService.findByEmail(email);

      const authentificated: boolean = await compare(
        password,
        foundUser.password,
      );

      if (!authentificated) {
        throw new UnauthorizedException();
      }
      return foundUser;
    } catch (err) {
      throw new UnauthorizedException('Credentials are not valid!');
    }
  }
}
