import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RevokedToken } from '../../auth/entities/revoked-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
  ) { }

  // Hash token để lưu vào DB
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Check token có bị revoke không
  async isTokenRevoked(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    const revokedToken = await this.revokedTokenRepository.findOne({
      where: { token: tokenHash },
    });
    return !!revokedToken;
  }

  // Revoke một token
  async revokeToken(token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    await this.revokedTokenRepository.save({ token: tokenHash });
  }

  // Revoke nhiều tokens cùng lúc
  async revokeTokens(tokens: string[]): Promise<void> {
    const hashedTokens = tokens.map(token => ({
      token: this.hashToken(token)
    }));
    await this.revokedTokenRepository.save(hashedTokens);
  }

  // Cleanup expired revoked tokens
  async cleanupExpiredRevokedTokens(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await this.revokedTokenRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }
}
