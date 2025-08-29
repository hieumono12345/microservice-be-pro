/* eslint-disable */
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { RevokedToken } from './entities/revoked-token.entity';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto } from './dto';
import { JwtService } from './jwt.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import { VaultService } from 'src/vault/vault.service';
import { v4 as uuidv4 } from 'uuid';
import { EmailOtpService } from './email-otp.service';
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class AuthService {

  private readonly logger = new Logger(AuthService.name);

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

  // async register(dto: RegisterDto) {
  //   const { username, password } = dto;

  //   const existingUser = await this.userRepository.findOne({ where: { username } });
  //   if (existingUser) throw new BadRequestException('Email already exists');

  //   const hashedPassword = await bcrypt.hash(password, 10);
  //   const emailVerificationToken = uuidv4();

  //   const user = this.userRepository.create({
  //     username,
  //     password: hashedPassword,
  //     provider: 'local',
  //     isEmailVerified: false,
  //     emailVerificationToken,
  //     emailVerificationTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
  //   });

  //   await this.userRepository.save(user);
  //   await this.emailOtpService.sendVerificationEmail(username, emailVerificationToken);

  //   return { message: 'Check your email to verify your account' };
  // }

  async register(dto: RegisterDto) {
    const { username, password } = dto;

    const user = await this.userRepository.findOne({ where: { username } });

    const now = new Date();
    const hashedPassword = await bcrypt.hash(password, 10);

    const emailVerificationToken = uuidv4();
    const tokenExpiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 phút

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


    // 1. Giải mã accept token
    const decodedAccess = this.jwtService.verifyAccessToken(acceptToken);
    // if (!decodedAccess || !decodedAccess.userId ) {
    //   throw new UnauthorizedException('Invalid access token');
    // }


    if (decodedAccess != null) {
      this.logger.log('Access token is still valid, no need to refresh.');
      return {
        accessToken: acceptToken,
        message: 'Access token still valid, no need to refresh.',
      };
    }

    // 3. Kiểm tra access token và refreshToken đã bị thu hồi chưa
    const isRefreshRevoked = await this.revokedTokenRepository.findOne({
      where: [
        { token: refreshToken },
        { token: acceptToken },
      ],
    });
    if (isRefreshRevoked) throw new UnauthorizedException('Refresh token or Accept token revoked ');

    // Thêm access token vào danh sách thu hồi
    // await this.revokedTokenRepository.save({ token: acceptToken });

    // 4. Giải mã refresh token
    const decodedRefresh = this.jwtService.verifyRefreshToken(refreshToken);
    if (!decodedRefresh || !decodedRefresh.userId) {
      throw new UnauthorizedException('relogin to get new access token');
    }
    if (!decodedRefresh || !decodedRefresh.sessionId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 5. Tìm session tương ứng
    const session = await this.userSessionRepository.findOne({
      where: {
        sessionId: decodedRefresh.sessionId,
        isRevoked: false,
      },
      relations: ['user'],
    });

    if (!session) throw new UnauthorizedException('Session not found');

    // 6. Kiểm tra IP hoặc User-Agent
    // const ipChanged = session.ipAddress !== ipAddress;
    // const uaChanged = session.userAgent !== userAgent;

    // if (ipChanged || uaChanged) {
    //   // Gửi email xác minh lại (tùy bạn tích hợp luồng email riêng)
    //   // await this.emailOtpService.sendVerificationForNewDevice(session.user.username);
    //   // throw new ForbiddenException('New device detected. Please verify via email.');
    // }

    // 7. Thu hồi access token cũ
    // await this.revokedTokenRepository.save({ token: acceptToken });

    // 8. Cấp access token mới
    this.logger.debug(`Decoded refresh token: ${JSON.stringify(decodedRefresh)}`);
    const newAccessToken = this.jwtService.signAccessToken({
      sub: decodedRefresh.userId,
      userId: decodedRefresh.userId,
      username: decodedRefresh.username,
      role: decodedRefresh.role,
    });

    return {
      accessToken: newAccessToken,
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
      if (user.failedLoginAttempts >= 5) {
        user.loginLockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Khóa trong 15 phút        
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

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
    // 5. lưu session vào DB có hashToken
    const refreshTokenHash = bcrypt.hashSync(refreshToken, 10);
    const session = this.userSessionRepository.create({
      sessionId,
      refreshTokenHash,
      user,
      ipAddress,
      userAgent,
      expiresAt,
    });
    await this.userSessionRepository.save(session);

    return { acceptToken, refreshToken };
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
    // 5. Thu hồi refresh token
    const refreshTokenHash = bcrypt.hashSync(dto.refreshToken, 10);
    const revokedToken = this.revokedTokenRepository.create({
      token: refreshTokenHash,
    });
    await this.revokedTokenRepository.save(revokedToken);
    // 6. Trả về thông báo thành công
    return { message: 'Logout successful' };
  }

  async me(acceptToken: string) {
    // 1. Lấy thông tin người dùng từ token
    const decodedAccess = this.jwtService.verifyAccessToken(acceptToken);
    if (!decodedAccess) {
      throw new UnauthorizedException('Invalid access token');
    }
    if (!decodedAccess.userId) {
      throw new UnauthorizedException('Invalid access token');
    }
    const user = await this.userRepository.findOne({
      where: { id: decodedAccess.userId },
      select: ['username', 'isEmailVerified', 'createdAt', 'updatedAt', "name", "phoneNumber", "address"],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2. Trả về thông tin người dùng
    return {
      id: user.id,
      username: user.username,
      email: user.username,
      isEmailVerified: user.isEmailVerified,
      name: user.name,
      phoneNumber: user.phoneNumber,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async forgetPassword(username: string) {
    // Người dùng nhập email muốn khôi phục.
    // Kiểm tra email có tồn tại trong hệ thống không.
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new BadRequestException('Email not found');
    }
    // kiểm tra email đã xác minh chưa
    if (!user.isEmailVerified) {
      throw new BadRequestException('Email not verified');
    }
    // Kiểm tra xem người dùng có đang bị khóa không
    if (user.loginLockedUntil && user.loginLockedUntil > new Date()) {
      throw new BadRequestException('Account temporarily locked. Try again later.');
    }

    // kiểm tra xem đã có token đặt lại mật khẩu chưa
    if (user.resetPasswordToken && user.resetPasswordTokenExpiresAt && user.resetPasswordTokenExpiresAt > new Date()) {
      // Nếu đã có token và chưa hết hạn, không cần tạo token mới
      this.logger.debug(`User ${user.username} already has a valid reset password token`);
      throw new BadRequestException('A password reset request is already in progress. Please check your email.');
    }


    // Tạo token đặt lại mật khẩu
    const resetToken = uuidv4();
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
    user.resetPasswordToken = resetToken;
    user.resetPasswordTokenExpiresAt = tokenExpiresAt;
    await this.userRepository.save(user);

    // Gửi email chứa link đặt lại mật khẩu
    // Link sẽ chứa token để xác minh
    await this.emailOtpService.sendPasswordResetEmail(username, resetToken);
    // sao đợi mãi chẳng trả về gì hết
    return { message: 'Password reset email sent. Please check your inbox.' };
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

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordTokenExpiresAt = null;

    await this.userRepository.save(user);

    return { message: 'Mật khẩu đã được đổi thành công' };
  }
}
