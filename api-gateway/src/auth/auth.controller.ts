import { Controller, Post, Get, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { VaultService } from 'src/vault/vault.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly vaultService: VaultService
  ) {}

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
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

}