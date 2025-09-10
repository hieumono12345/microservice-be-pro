import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CleanupTask {
  private readonly logger = new Logger(CleanupTask.name);

  constructor(private readonly authService: AuthService) {}

  // Chạy cleanup mỗi ngày lúc 2:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanup() {
    this.logger.log('Starting scheduled cleanup...');
    try {
      await this.authService.cleanupExpiredSessions();
      this.logger.log('Scheduled cleanup completed successfully');
    } catch (error) {
      this.logger.error('Scheduled cleanup failed', error.stack);
    }
  }

  // Cleanup sessions mỗi 6 tiếng
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleSessionCleanup() {
    this.logger.log('Starting session cleanup...');
    try {
      await this.authService.cleanupExpiredSessions();
      this.logger.log('Session cleanup completed successfully');
    } catch (error) {
      this.logger.error('Session cleanup failed', error.stack);
    }
  }
}
