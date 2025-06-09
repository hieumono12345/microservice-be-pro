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
}