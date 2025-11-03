import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { User } from '../user/models/user.entity';
import { compare } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './token_payload.interface';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
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

    const tokenPayload: TokenPayload = {
      userId: user.id,
    };

    const accessToken = this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: `${this.configService.getOrThrow(
        'JWT_ACCESS_TOKEN_EXPIRATION_MS',
      )}ms`,
    });

    response.cookie('Authentification', accessToken, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      expires: expiresAcessToken,
    });
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
