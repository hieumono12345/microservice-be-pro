/* eslint-disable */
import { Controller, Post, Get, Body, ValidationPipe, Query, Header, HttpCode, Req, Res, Logger, Render, Delete, Param, UseGuards, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto, ResetPasswordDto, UpdateUserDto } from './dto';
import { VaultService } from 'src/vault/vault.service';
import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RoleGuard } from '../jwt/role.guard';
import { ParseUUIDPipe } from '../common/pipes/parse-uuid.pipe';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService,
    private readonly vaultService: VaultService
  ) { }

  @Post('sign-up')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('aes')
  async getAes() {
    return {
      aesKey: await this.vaultService.getAesKey(),
    };
  }

  @Get('api-key')
  async getApiKey() {
    return {
      data: await this.vaultService.getGatewayApiKey(),
    };
  }

  @Get('keyHttps')
  async getKey() {
    return {
      apiKey: await this.vaultService.getTlsCert(),
    };
  }

  @Get('verify-email')
  @Header('Content-Type', 'text/html')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  //  test bằng postman nên 
  @Post('refresh-token')
  async refreshToken(@Body() body: { acceptToken: string, refreshToken: string }, @Req() req: Request, @Res() res: Response) {

    const dto: RefreshTokenDto = {
      refreshToken: body.refreshToken,
      acceptToken: body.acceptToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    const result = await this.authService.refreshToken(dto);
    return res.json({ accessToken: result.accessToken });
  }

  @Post('sign-in')
  async login(@Body(ValidationPipe) loginDto: LoginDto, @Req() req: Request) {
    Logger.log('Login request received', loginDto.username);
    // Ghi đè IP và User-Agent vào loginDto
    loginDto.ipAddress = req.ip;
    loginDto.userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.login(loginDto);
    // return "oke";
  }

  @Post('logout')
  async logout(@Body() body: { refreshToken: string, acceptToken: string }, @Req() req: Request, @Res() res: Response) {
    const dto: LogoutDto = {
      refreshToken: body.refreshToken,
      acceptToken: body.acceptToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    };
    const result = await this.authService.logout(dto);
    return res.json({ message: result.message });
  }

  @Get('me')
  getMe(@Req() req: Request, @Res() res: Response) {
    const acceptToken = req.headers['authorization']?.replace('Bearer ', '');
    if (!acceptToken) {
      return res.status(401).json({ message: 'Authorization token is missing' });
    }
    return this.authService.me(acceptToken)
      .then(user => res.json(user))
      .catch(err => res.status(err.status || 500).json({ message: err.message }));
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }, @Res() res: Response) {
    Logger.debug('Forgot password request received', body.email);
    const email = body.email;
    if (!email) {
      // Nếu không có email, trả về lỗi
      Logger.warn('Email is required for forgot password');
      return res.status(400).json({ message: 'Email is required' });
    }

    return this.authService.forgotPassword(email)
      .then(user => res.json(user))
      .catch(err => res.status(err.status || 500).json({ message: err.message }));
  }

  @Get('reset-password')
  async resetPasswordPage(@Query('token') token: string, @Res() res: Response) {
    const html = readFileSync(join(__dirname, '../../src', 'views', 'reset-password.html'), 'utf8');
    const htmlWithToken = html.replace('{{token}}', token);

    return res.send(htmlWithToken);
  }

  @Post('reset-password')
  async handleResetPassword(@Body() dto: ResetPasswordDto, @Res() res: Response) {
    const { token, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword || newPassword.length < 6 || newPassword == null) {
      return res.status(400).send('Mật khẩu không khớp');
    }

    await this.authService.resetPassword(dto);
    return res.send('Mật khẩu đã được đổi thành công');
  }

  /**
   * Delete a user by ID (Admin only)
   */
  @Delete('delete-user/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  @HttpCode(200)
  async deleteUser(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    try {
      const result = await this.authService.deleteUser(id);
      this.logger.log(`User ${id} deleted successfully`);
      return res.json(result);
    } catch (error) {
      this.logger.error(`Delete user error: ${error.message}`);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  /**
   * Get all users (Admin only)
   */
  @Get('get-all')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  async getAllUsers(@Res() res: Response) {
    try {
      const users = await this.authService.getAll();
      return res.json(users);
    } catch (error) {
      this.logger.error(`Get all users error: ${error.message}`);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  /**
   * Get user by ID (Admin only)
   */
  @Get('get-user/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  async getUserById(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    try {
      const user = await this.authService.getUserById(id);
      return res.json(user);
    } catch (error) {
      this.logger.error(`Get user by ID error: ${error.message}`);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }

  /**
   * Update user by ID (Admin only)
   */
  @Put('update-user/:id')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  @HttpCode(200)
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @Res() res: Response
  ) {
    try {
      const result = await this.authService.updateUser(id, updateUserDto);
      this.logger.log(`User ${id} updated successfully`);
      return res.json(result);
    } catch (error) {
      this.logger.error(`Update user error: ${error.message}`);
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
}
