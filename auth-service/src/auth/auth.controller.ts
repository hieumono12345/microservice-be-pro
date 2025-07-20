import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

@Controller()
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register')
  async register(encryptedData: string) {
    return this.authService.handleRegister(encryptedData);
  }

  @MessagePattern('auth.login')
  async login(encryptedData: string) {
    return this.authService.handleLogin(encryptedData);
  }

  @MessagePattern('auth.verifyEmail')
  async verifyEmail(token: string) {
    return this.authService.verifyEmail(token);
  }

  @MessagePattern('auth.refresh-token')
  async refreshToken(encryptedData: string) {
    return this.authService.handleRefreshToken(encryptedData);
  }

  @MessagePattern('auth.logout')
  async logout(encryptedData: string) {
    return this.authService.handleLogout(encryptedData);
  }

  @MessagePattern('auth.me')
  async me(acceptToken: string) {
    return this.authService.me(acceptToken);
  }

  @MessagePattern('auth.forgot-password')
  async forgotPassword(encryptedData: string) {
    return this.authService.forgetPassword(encryptedData);
  }

  @MessagePattern('auth.resetPassword')
  async resetPassword(encryptedData: string) {
    return this.authService.handleResetPassword(encryptedData);
  }
}
