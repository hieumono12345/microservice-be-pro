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
}