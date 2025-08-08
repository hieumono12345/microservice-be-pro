/* eslint-disable */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}

  verifyAccessToken(token: string): { sub: string; userId: string; username: string; role: string } {
    const secret = this.configService.get<string>('JWT_SECRET', 'your-secret-key');
    try {
      return jwt.verify(token, secret) as { sub: string; userId: string; username: string; role: string };
    } catch (error) {
      throw new UnauthorizedException(`Invalid access token: ${error.message}`);
    }
  }
}
