/* eslint-disable */
// src/auth/email-otp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer'; // nếu dùng @nestjs-modules/mailer

@Injectable()
export class EmailOtpService {
  private readonly logger = new Logger(EmailOtpService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `https://localhost:3443/auth/verify-email?token=${token}`;
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email',
        template: './verify', // e.g., src/templates/verify.hbs
        context: {
          email,
          url: verificationUrl,
        },
      });
      this.logger.log(`Sent email verification to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${email}`, err.stack);
      throw err;
    }
  }

  // verifuDeviceEmail(email: string, token: string): Promise<void> {
  // veri  

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `https://localhost:3443/auth/reset-password?token=${token}`;
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your Password',
        template: './password-reset', // e.g. src/templates/password-reset.hbs
        context: {
          email,
          url: resetUrl,
        },
      });
      this.logger.log(`Sent password reset email to ${email}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${email}`, err.stack);
      throw err;
    }
  }

}
