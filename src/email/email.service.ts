import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: true,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendActivationEmail(email: string, token: string) {
    try {
      const activationUrl = `${this.configService.get('FRONTEND_URL')}/activate?token=${token}`;

      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Activate Your Account',
        html: `
        <h1>Welcome!</h1>
        <p>Please click the link below to activate your account:</p>
        <a href="${activationUrl}">Activate Account</a>
        <p>This link will expire in 24 hours.</p>
      `,
      });
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    try {
      const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: email,
        subject: 'Reset Your Password',
        html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      });
    } catch (err: any) {
      this.logger.error(`error occured ! ${err}`);
      throw new InternalServerErrorException(`error occured ! ${err}`);
    }
  }
}
