/* eslint-disable */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  sign(payload: { userId: string; username: string }): string {
    const secret = this.configService.get<string>('JWT_SECRET', 'your-secret-key');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '1h');

    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  signAccessToken(payload: { sub: string ,userId: string; username: string, role: string }): string {
    const secret = this.configService.get<string>('JWT_SECRET', 'your-secret-key');
    // const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '3m');
    const expiresIn = '3h';
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  signRefreshToken(payload: { sessionId: string, sub: string ,userId: string; username: string, role: string}): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET', 'your-refresh-secret');
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): any {
    const secret = this.configService.get<string>('JWT_SECRET', 'your-secret-key');
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      
      return null; // or handle the error as needed
    }
  }

  verifyRefreshToken(token: string): any {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET', 'your-refresh-secret');
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      return null; // or handle the error as needed
    }
  }

  // signForgotPasswordToken(payload: { email: string, passWord: string, salt: string }): string {
  //   const secret = this.configService.get<string>('JWT_FORGOT_PASSWORD_SECRET', 'your-forgot-password-secret');
  //   const expiresIn = this.configService.get<string>('JWT_FORGOT_PASSWORD_EXPIRES_IN', '15m');
  //   return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  // }

  // verifyForgotPasswordToken(token: string): any {
  //   const secret = this.configService.get<string>('JWT_FORGOT_PASSWORD_SECRET', 'your-forgot-password-secret');
  //   try {
  //     return jwt.verify(token, secret);
  //   }
  //   catch (error) {
  //     return null; // or handle the error as needed
  //   }
  // }
}