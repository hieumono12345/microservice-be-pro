/* eslint-disable */
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { RevokedToken } from './entities/revoked-token.entity';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto, UpdateUserDto } from './dto';
import { JwtService } from './jwt.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import { VaultService } from 'src/vault/vault.service';
import { v4 as uuidv4 } from 'uuid';
import { EmailOtpService } from './email-otp.service';
import * as fs from 'fs';
import * as path from 'path';
import { LessThan } from 'typeorm';

@Injectable()
export class AuthService {

  private readonly logger = new Logger(AuthService.name);

  // Configuration constants
  private readonly CONFIG = {
    EMAIL_VERIFICATION_TOKEN_EXPIRES_MINUTES: 15,
    PASSWORD_RESET_TOKEN_EXPIRES_MINUTES: 15,
    ACCOUNT_LOCK_DURATION_MINUTES: 15,
    MAX_FAILED_LOGIN_ATTEMPTS: 5,
    REFRESH_TOKEN_EXPIRES_DAYS: 7,
    BCRYPT_SALT_ROUNDS: 12, // Tăng từ 10 lên 12 cho bảo mật tốt hơn
  };

  // Helper method để hash tokens một cách consistent  
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly vaultService: VaultService,
    private readonly emailOtpService: EmailOtpService,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    @InjectRepository(RevokedToken)
    private readonly revokedTokenRepository: Repository<RevokedToken>,
  ) { }

  private async decrypt(encryptedData: string): Promise<any> {
    try {
      const [ivHex, encryptedHex] = encryptedData.split(':');
      // const key = this.configService.get<string>('AES_KEY');
      const key = await this.vaultService.getAesKey();
      if (!key) {
        this.logger.error('AES_KEY is not defined in environment variables');
        throw new Error('AES_KEY is missing');
      }

      const keyBuffer = Buffer.from(key, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      this.logger.debug(`Decrypted data: ${decrypted}`);
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error(`Decryption failed: ${error.message}`);
      throw new BadRequestException('Decryption failed');
    }
  }

  async handleRegister(encryptedData: string) {
    const dto: RegisterDto = await this.decrypt(encryptedData);
    return this.register(dto);
  }

  async handleLogin(encryptedData: string) {
    const dto: LoginDto = await this.decrypt(encryptedData);
    return this.login(dto);
  }

  async handleRefreshToken(encryptedData: string) {
    const dto: RefreshTokenDto = await this.decrypt(encryptedData);
    return this.refreshToken(dto);
  }

  async handleLogout(encryptedData: string) {
    const dto: LogoutDto = await this.decrypt(encryptedData);
    return this.logout(dto);
  }

  async handleResetPassword(encryptedData: string) {
    const dto: { token: string; newPassword: string } = await this.decrypt(encryptedData);
    return this.resetPassword(dto.token, dto.newPassword);
  }

  async handleForgotPassword(encryptedData: string) {
    const dto: { email: string } = await this.decrypt(encryptedData);
    return this.forgetPassword(dto.email);
  }

  async register(dto: RegisterDto) {
    const { username, password } = dto;

    const user = await this.userRepository.findOne({ where: { username } });

    const now = new Date();
    const hashedPassword = await bcrypt.hash(password, this.CONFIG.BCRYPT_SALT_ROUNDS);

    const emailVerificationToken = uuidv4();
    const tokenExpiresAt = new Date(now.getTime() + this.CONFIG.EMAIL_VERIFICATION_TOKEN_EXPIRES_MINUTES * 60 * 1000);

    if (user) {
      if (user.isEmailVerified) {
        throw new BadRequestException('Email đã được sử dụng.');
      }

      const isTokenExpired = !user.emailVerificationTokenExpiresAt || user.emailVerificationTokenExpiresAt < now;

      if (isTokenExpired) {
        // Token hết hạn: cấp lại token mới và cập nhật mật khẩu
        Object.assign(user, {
          password: hashedPassword,
          emailVerificationToken,
          emailVerificationTokenExpiresAt: tokenExpiresAt,
        });

        await this.userRepository.save(user);
        await this.emailOtpService.sendVerificationEmail(username, emailVerificationToken);

        return { message: 'Token xác minh mới đã được gửi tới email của bạn.' };
      }

      // Token vẫn còn hiệu lực
      throw new BadRequestException('Email đã tồn tại nhưng chưa xác minh. Vui lòng kiểm tra email của bạn.');
    }

    // User chưa tồn tại: tạo mới
    const newUser = this.userRepository.create({
      username,
      password: hashedPassword,
      provider: 'local',
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationTokenExpiresAt: tokenExpiresAt,
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      address: dto.address,
      // role: 'admin', // hoặc 'user' tùy ý
    });

    await this.userRepository.save(newUser);
    await this.emailOtpService.sendVerificationEmail(username, emailVerificationToken);

    return { message: 'Tài khoản đã được tạo. Vui lòng kiểm tra email để xác minh.' };
  }

  async verifyEmail(token: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return this.readHtml('invalid-token.html');
    }

    if (
      !user.emailVerificationTokenExpiresAt ||
      user.emailVerificationTokenExpiresAt < new Date()
    ) {
      return this.readHtml('token-expired.html');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpiresAt = null;
    await this.userRepository.save(user);

    return this.readHtml('verify-success.html');
  }

  private readHtml(filename: string): string {
    const filePath = path.join(__dirname, '../../src', 'templates', filename);
    return fs.readFileSync(filePath, 'utf8');
  }

  async refreshToken(dto: RefreshTokenDto) {
    const { acceptToken, refreshToken, ipAddress, userAgent } = dto;

    // 1. Luôn kiểm tra refresh token trước
    const decodedRefresh = this.jwtService.verifyRefreshToken(refreshToken);
    if (!decodedRefresh || !decodedRefresh.userId || !decodedRefresh.sessionId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Kiểm tra session tồn tại và chưa bị revoke
    const session = await this.userSessionRepository.findOne({
      where: {
        sessionId: decodedRefresh.sessionId,
        isRevoked: false,
        ipAddress: ipAddress,
        userAgent: userAgent
      },
      relations: ['user'],
    });

    if (!session) throw new UnauthorizedException('Session not found or revoked');

    // 3. Verify refresh token hash (sửa lỗi inconsistency)
    const refreshTokenHashNew = this.hashToken(refreshToken);
    // const isValidRefreshToken = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (refreshTokenHashNew !== session.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token hash');
    }

    // 4. Kiểm tra access token (optional optimization)
    const decodedAccess = this.jwtService.verifyAccessToken(acceptToken);
    if (decodedAccess != null) {
      this.logger.log('Access token is still valid, no need to refresh.');
      return {
        accessToken: acceptToken,
        message: 'Access token still valid, no need to refresh.',
      };
    }

    // 5. Kiểm tra revoked tokens (check cả access token và refresh token)
    const accessTokenHash = this.hashToken(acceptToken);
    const refreshTokenHash = this.hashToken(refreshToken);

    const isTokenRevoked = await this.revokedTokenRepository.findOne({
      where: [
        { token: accessTokenHash },
        { token: refreshTokenHash }
      ],
    });
    if (isTokenRevoked) throw new UnauthorizedException('Token has been revoked');

    // 6. Cấp access token mới
    this.logger.debug(`Decoded refresh token: ${JSON.stringify(decodedRefresh)}`);
    const newAccessToken = this.jwtService.signAccessToken({
      sub: decodedRefresh.userId,
      userId: decodedRefresh.userId,
      username: decodedRefresh.username,
      role: decodedRefresh.role,
    });

    return {
      access_token: newAccessToken,
    };
  }

  async login(dto: LoginDto) {
    const { username, password, ipAddress, userAgent } = dto;
    // 1. Tìm người dùng
    const user = await this.userRepository.findOne({ where: { username } });

    // 2. Kiểm tra người dùng có tồn tại không
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Kiểm tra email đã được xác minh
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    // Kiểm tra bị khóa
    if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked. Try again later.');
    }

    // 3. Kiểm tra mật khẩu

    const isMatch = await bcrypt.compare(password, user?.password);

    if (!isMatch) {
      // Tăng số lần đăng nhập sai
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      // Kiểm tra nếu vượt quá giới hạn
      if (user.failedLoginAttempts >= this.CONFIG.MAX_FAILED_LOGIN_ATTEMPTS) {
        user.loginLockedUntil = new Date(Date.now() + this.CONFIG.ACCOUNT_LOCK_DURATION_MINUTES * 60 * 1000); // Khóa trong 15 phút        
        user.failedLoginAttempts = 0; // Reset số lần đăng nhập sai
        this.logger.warn(`User ${username} locked due to too many failed login attempts`);
        await this.userRepository.save(user);
        throw new UnauthorizedException('Account temporarily locked due to too many failed login attempts. Try again later.');
      }

      this.logger.warn(`Invalid password for user ${username}. Failed attempts: ${user.failedLoginAttempts}`);
      // Lưu người dùng với số lần đăng nhập sai
      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Nếu mật khẩu đúng, reset số lần đăng nhập sai
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.loginLockedUntil = null; // Reset khóa nếu có
      await this.userRepository.save(user);
    }

    // 4. tạo access token
    const acceptToken = this.jwtService.signAccessToken({
      sub: user.id,
      userId: user.id,
      username: user.username,
      role: user.role, // lấy role sau
    });


    // 5. tạo refresh token
    const sessionId = uuidv4();
    const refreshToken = this.jwtService.signRefreshToken({
      sessionId: sessionId, // tạo sessionId mới
      sub: user.id,
      userId: user.id,
      username: user.username,
      role: user.role, // lấy role sau
    });

    const expiresAt = new Date(Date.now() + this.CONFIG.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000); // 7 ngày
    // 5. lưu session vào DB có hashToken
    // const refreshTokenHash = bcrypt.hashSync(refreshToken, 10);
    const refreshTokenHash = this.hashToken(refreshToken)
    const session = this.userSessionRepository.create({
      sessionId,
      refreshTokenHash,
      user,
      ipAddress,
      userAgent,
      expiresAt,
    });
    await this.userSessionRepository.save(session);

    return {
      access_token: acceptToken,
      refresh_token: refreshToken
    };
  }

  async logout(dto: LogoutDto) {
    // 1 . Kiểm tra refresh token
    const decodedRefreshToken = this.jwtService.verifyRefreshToken(dto.refreshToken);
    if (decodedRefreshToken == null) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // 2. Tìm session theo sessionId
    const sessionId = decodedRefreshToken.sessionId;
    const session = await this.userSessionRepository.findOne({ where: { sessionId } });
    if (!session) {
      throw new UnauthorizedException('Session not found');
    }
    // 3. Kiểm tra xem có cùng ip và userAgent không
    if (session.ipAddress !== dto.ipAddress || session.userAgent !== dto.userAgent) {
      // Nghiên cứu có nên gửi email xác minh không
      throw new UnauthorizedException('IP address or User-Agent mismatch');
    }
    // 4. Đánh dấu session là đã thu hồi
    session.isRevoked = true;
    await this.userSessionRepository.save(session);

    // 5. Thu hồi cả refresh token và access token (hash trước khi lưu)
    const tokensToRevoke = [
      { token: this.hashToken(dto.refreshToken) },
      { token: this.hashToken(dto.acceptToken) }
    ];

    await this.revokedTokenRepository.save(tokensToRevoke);

    // 6. Trả về thông báo thành công
    return { message: 'Logout successful' };
  }

  async me(acceptToken: string) {
    // 1. Kiểm tra token có bị revoke không
    const accessTokenHash = this.hashToken(acceptToken);
    const isTokenRevoked = await this.revokedTokenRepository.findOne({
      where: { token: accessTokenHash },
    });
    if (isTokenRevoked) {
      throw new UnauthorizedException('Access token has been revoked');
    }

    // 2. Lấy thông tin người dùng từ token
    const decodedAccess = this.jwtService.verifyAccessToken(acceptToken);
    if (!decodedAccess) {
      throw new UnauthorizedException('Invalid access token');
    }
    if (!decodedAccess.userId) {
      throw new UnauthorizedException('Invalid access token');
    }
    const user = await this.userRepository.findOne({
      where: { id: decodedAccess.userId },
      select: ['username', 'createdAt', 'updatedAt', "name", "phoneNumber", "address", "role"],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 3. Trả về thông tin người dùng
    return {
      id: decodedAccess.userId,
      username: user.username,
      email: user.username,
      name: user.name,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async forgetPassword(username: string) {
    try {
      // Người dùng nhập email muốn khôi phục.
      // Kiểm tra email có tồn tại trong hệ thống không.
      const user = await this.userRepository.findOne({ where: { username } });
      if (!user) {
        return {
          statusCode: 404,
          message: 'Email not found'
        };
      }
      // kiểm tra email đã xác minh chưa
      if (!user.isEmailVerified) {
        return {
          statusCode: 400,
          message: 'Email not verified'
        };
      }
      // Kiểm tra xem người dùng có đang bị khóa không
      if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
        return {
          statusCode: 400,
          message: 'Account temporarily locked. Try again later.'
        };
      }

      // kiểm tra xem đã có token đặt lại mật khẩu chưa
      if (user.resetPasswordToken && user.resetPasswordTokenExpiresAt && user.resetPasswordTokenExpiresAt > new Date()) {
        // Nếu đã có token và chưa hết hạn, không cần tạo token mới
        this.logger.debug(`User ${user.username} already has a valid reset password token`);
        return {
          statusCode: 400,
          message: 'A password reset request is already in progress. Please check your email.'
        };
      }

      // Tạo token đặt lại mật khẩu
      const resetToken = uuidv4();
      const tokenExpiresAt = new Date(Date.now() + this.CONFIG.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000); // 15 phút
      user.resetPasswordToken = resetToken;
      user.resetPasswordTokenExpiresAt = tokenExpiresAt;
      await this.userRepository.save(user);

      // Gửi email chứa link đặt lại mật khẩu
      // Link sẽ chứa token để xác minh
      await this.emailOtpService.sendPasswordResetEmail(username, resetToken);

      return {
        statusCode: 200,
        message: 'Password reset email sent. Please check your inbox.'
      };
    } catch (error) {
      this.logger.error(`Forgot password error: ${error.message}`);
      return {
        statusCode: 500,
        message: 'Failed to process forgot password request',
        error: error.message
      };
    }
  }

  async resetPassword(token: string, newPassword: string) {
    this.logger.debug(`Reset password request received with token: ${token}`);
    this.logger.debug(`New password length: ${newPassword.length}`);
    const user = await this.userRepository.findOne({ where: { resetPasswordToken: token } });
    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    if (!user.resetPasswordTokenExpiresAt || user.resetPasswordTokenExpiresAt < new Date()) {
      throw new BadRequestException('Token không hợp lệ hoặc đã hết hạn');
    }

    user.password = await bcrypt.hash(newPassword, this.CONFIG.BCRYPT_SALT_ROUNDS);
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiresAt = null;

    await this.userRepository.save(user);

    return { message: 'Mật khẩu đã được đổi thành công' };
  }

  // Cleanup methods for maintenance
  async cleanupExpiredSessions() {
    const now = new Date();

    // Remove expired sessions
    const expiredSessionsResult = await this.userSessionRepository.delete({
      expiresAt: LessThan(now)
    });

    // Remove old revoked tokens (older than 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const cleanedTokensResult = await this.revokedTokenRepository.delete({
      createdAt: LessThan(thirtyDaysAgo)
    });

    this.logger.log(`Cleanup completed: removed ${expiredSessionsResult.affected || 0} expired sessions and ${cleanedTokensResult.affected || 0} old revoked tokens`);

    return {
      expiredSessions: expiredSessionsResult.affected || 0,
      expiredTokens: cleanedTokensResult.affected || 0,
    };
  }

  // Rate limiting để ngăn brute force
  private async checkRateLimit(identifier: string, maxAttempts: number = 10, windowMs: number = 15 * 60 * 1000): Promise<boolean> {
    // Implementation would depend on your caching solution (Redis, etc.)
    // This is a placeholder for rate limiting logic
    return true;
  }

  // Constant-time comparison để ngăn timing attacks
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  // Method để revoke specific token
  async revokeToken(token: string) {
    const tokenHash = this.hashToken(token);
    await this.revokedTokenRepository.save({ token: tokenHash });
    this.logger.log(`Token revoked: ${token.substring(0, 10)}...`);
  }

  // Method để revoke tất cả sessions của user
  async revokeAllUserSessions(userId: string) {
    const result = await this.userSessionRepository.update(
      { user: { id: userId } },
      { isRevoked: true }
    );
    this.logger.log(`Revoked ${result.affected} sessions for user ${userId}`);
    return { message: `Revoked ${result.affected} sessions` };
  }

  // Method để check token có bị revoke không
  async isTokenRevoked(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);
    const revokedToken = await this.revokedTokenRepository.findOne({
      where: { token: tokenHash },
    });
    return !!revokedToken;
  }

  // ===== ADMIN METHODS =====

  async handleGetAllUsers() {
    return this.getAllUsers();
  }

  async handleDeleteUser(encryptedData: string) {
    const dto: { id: string } = await this.decrypt(encryptedData);
    return this.deleteUser(dto.id);
  }

  async handleGetUserById(encryptedData: string) {
    const dto: { id: string } = await this.decrypt(encryptedData);
    return this.getUserById(dto.id);
  }

  async handleUpdateUser(encryptedData: string) {
    const dto: { id: string; updateData: UpdateUserDto } = await this.decrypt(encryptedData);
    return this.updateUser(dto.id, dto.updateData);
  }

  // Core admin methods
  async getAllUsers() {
    try {
      const users = await this.userRepository.find({
        select: ['id', 'username', 'name', 'phoneNumber', 'address', 'role', 'isEmailVerified', 'createdAt', 'updatedAt'],
        order: { createdAt: 'DESC' }
      });

      // Map username to email in the returned data
      const mappedUsers = users.map(user => ({
        ...user,
        email: user.username
      }));

      return {
        statusCode: 200,
        message: 'Users retrieved successfully',
        data: mappedUsers,
        total: mappedUsers.length
      };
    } catch (error) {
      this.logger.error(`Get all users error: ${error.message}`);
      return {
        statusCode: 500,
        message: 'Failed to retrieve users',
        error: error.message
      };
    }
  }

  async deleteUser(id: string) {
    try {
      if (!id) {
        return {
          statusCode: 400,
          message: 'User ID is required'
        };
      }

      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        return {
          statusCode: 404,
          message: 'User not found'
        };
      }

      // Revoke all user sessions before deletion
      await this.revokeAllUserSessions(id);

      // Delete user
      await this.userRepository.remove(user);

      this.logger.log(`User ${id} deleted successfully`);
      return {
        statusCode: 200,
        message: 'User deleted successfully'
      };
    } catch (error) {
      this.logger.error(`Delete user error: ${error.message}`);
      return {
        statusCode: 500,
        message: 'Failed to delete user',
        error: error.message
      };
    }
  }

  async getUserById(id: string) {
    try {
      if (!id) {
        return {
          statusCode: 400,
          message: 'User ID is required'
        };
      }

      const user = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'username', 'name', 'phoneNumber', 'address', 'role', 'isEmailVerified', 'createdAt', 'updatedAt']
      });

      if (!user) {
        return {
          statusCode: 404,
          message: 'User not found'
        };
      }

      return {
        statusCode: 200,
        message: 'User retrieved successfully',
        data: user
      };
    } catch (error) {
      this.logger.error(`Get user by ID error: ${error.message}`);
      return {
        statusCode: 500,
        message: 'Failed to retrieve user',
        error: error.message
      };
    }
  }

  async updateUser(id: string, updateData: UpdateUserDto) {
    try {
      if (!id) {
        return {
          statusCode: 400,
          message: 'User ID is required'
        };
      }

      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        return {
          statusCode: 404,
          message: 'User not found'
        };
      }

      // Filter out undefined fields from updateData
      const filteredUpdateData: Partial<UpdateUserDto> = {};
      if (updateData.name !== undefined) filteredUpdateData.name = updateData.name;
      if (updateData.phoneNumber !== undefined) filteredUpdateData.phoneNumber = updateData.phoneNumber;
      if (updateData.address !== undefined) filteredUpdateData.address = updateData.address;
      if (updateData.role !== undefined) filteredUpdateData.role = updateData.role;

      if (Object.keys(filteredUpdateData).length === 0) {
        return {
          statusCode: 400,
          message: 'No valid fields to update'
        };
      }

      // Update user
      await this.userRepository.update(id, filteredUpdateData);

      // Logout all sessions after successful update
      await this.revokeAllUserSessions(id);

      // Get updated user
      const updatedUser = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'username', 'name', 'phoneNumber', 'address', 'role', 'isEmailVerified', 'createdAt', 'updatedAt']
      });

      this.logger.log(`User ${id} updated successfully and all sessions revoked`);
      return {
        statusCode: 200,
        message: 'User updated successfully. All active sessions have been logged out for security.',
        data: updatedUser
      };
    } catch (error) {
      this.logger.error(`Update user error: ${error.message}`);
      return {
        statusCode: 500,
        message: 'Failed to update user',
        error: error.message
      };
    }
  }
}
