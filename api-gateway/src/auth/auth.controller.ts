/* eslint-disable */
import { Controller, Post, Get, Body, ValidationPipe, Query, Header, HttpCode, Req, Res, Logger, Render } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto, ResetPasswordDto } from './dto';
import { VaultService } from 'src/vault/vault.service';
import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly vaultService: VaultService
  ) {}

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // @Post('login')
  // async login(@Body(ValidationPipe) loginDto: LoginDto) {
  //   return this.authService.login(loginDto);
  // }

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

  // Chuẩn lấy refresh token từ cookie
  // @Post('refresh-token')
  // @HttpCode(200)
  // // @UsePipes(new ValidationPipe({ whitelist: true }))
  // async refreshToken(@Req() req: Request, @Res() res: Response, @Body() body: { acceptToken: string }) {
  //   const refreshToken = req.cookies?.refreshToken;
  //   if (!refreshToken) {
  //     return res.status(401).json({ message: 'Refresh token missing in cookie' });
  //   }

  //   const dto: RefreshTokenDto = {
  //     refreshToken,
  //     acceptToken: body.acceptToken,
  //     ipAddress: req.ip,
  //     userAgent: req.headers['user-agent'] || 'unknown',
  //   };

  //   const result = await this.authService.refreshToken(dto);
  //   return res.json({ accessToken: result.accessToken });
  // }

  //  test bằng postman nên 
  @Post('refresh-token')
  async refreshToken(@Body() body: { acceptToken: string , refreshToken: string}, @Req() req: Request, @Res() res: Response) {
    
    const dto: RefreshTokenDto = {
      refreshToken: body.refreshToken,
      acceptToken: body.acceptToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    const result = await this.authService.refreshToken(dto);
    return res.json({ accessToken: result.accessToken });
  }


  @Post('login')
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

}