import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
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
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly firebaseService: FirebaseService,
  ) {}

  async login(user: User, response: Response) {
    console.log(user);
    try {
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
        secret: this.configService.getOrThrow<string>(
          'JWT_ACCESS_TOKEN_SECRET',
        ),
        expiresIn: `${this.configService.getOrThrow(
          'JWT_ACCESS_TOKEN_EXPIRATION_MS',
        )}ms`,
      });

      const refreshToken = this.jwtService.sign(tokenPayload, {
        secret: this.configService.getOrThrow<string>(
          'JWT_REFRESH_TOKEN_SECRET',
        ),
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
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async loginFirBase() {}

  async logout(userId: string, response: Response) {
    try {
      response.clearCookie('Authentification');
      response.clearCookie('Refresh');
      await this.userService.updateRefreshToken(userId, null);

      return { message: 'Logged out successfully' };
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async sendActivationToken(userId: string): Promise<{ message: string }> {
    try {
      const user: User = await this.userService.findById(userId);

      const activationToken = randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000);

      await this.userService.createActivationToken(
        user.id,
        activationToken,
        resetTokenExpiry,
      );

      await this.emailService.sendActivationEmail(user.email, activationToken);

      return { message: 'An email has been sent to activate your account!' };
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async activateAccount(token: string) {
    try {
      const user = await this.userService.findByActivationToken(token);

      await this.userService.activateUser(user.id, token);

      return { message: 'Account activated successfully. You can now login.' };
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async forgotPassword(email: string) {
    try {
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
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const user = await this.userService.findByResetToken(token);

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await this.userService.updatePasswordAndResetToken(
        user.id,
        token,
        hashedPassword,
      );

      return {
        message:
          'Password reset successfully. You can now login with your new password.',
      };
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
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
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }
}
