import { Injectable, Inject, HttpException, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RegisterDto, LoginDto } from './dto';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { VaultService } from 'src/vault/vault.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
    private readonly configService: ConfigService,
    private readonly vaultService:  VaultService
  ) {}

  private async encrypt(data: any): Promise<string> {
    try {
      const keyHex = await this.vaultService.getAesKey();

      if (!keyHex) {
        this.logger.error('AES key is missing from Vault');
        throw new HttpException('Encryption key not found', 500);
      }

      const keyBuffer = Buffer.from(keyHex, 'hex');
      if (keyBuffer.length !== 32) {
        this.logger.error(`Invalid AES key length: ${keyBuffer.length} bytes`);
        throw new HttpException('Invalid AES key length', 500);
      }

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
      const jsonData = JSON.stringify(data);
      
      let encrypted = cipher.update(jsonData, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const result = `${iv.toString('hex')}:${encrypted}`;
      this.logger.debug('Encryption successful');

      return result;
    } catch (error) {
      this.logger.error(`Encryption failed: ${error.message}`, error.stack);
      throw new HttpException('Encryption failed', 500);
    }
  }

  async onModuleInit() {
    try {
      ['auth.register', 'auth.login'].forEach((pattern) =>
        this.authClient.subscribeToResponseOf(pattern),
      );
      await this.authClient.connect();
      this.logger.log('Connected to Kafka successfully');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`);
      throw new Error(`Kafka connection failed: ${error.message}`);
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const encryptedData = this.encrypt(registerDto);
      this.logger.log(`Sending register request to Kafka: ${encryptedData}`);
      const response = await firstValueFrom(
        this.authClient.send('auth.register', encryptedData),
      );

      if (response.statusCode >= 400) {
        this.logger.warn(`Register failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      this.logger.log('Register successful');
      return response;
    } catch (error) {
      this.logger.error(`Register error: ${error.message}`);
      throw new HttpException('Internal server error', 500);
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const encryptedData = await this.encrypt(loginDto);
      this.logger.log(`Sending login request to Kafka: ${encryptedData}`);
      const response = await firstValueFrom(
        this.authClient.send('auth.login', encryptedData),
      );

      if (response.statusCode >= 400) {
        this.logger.warn(`Login failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      this.logger.log('Login successful');
      return response;
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      throw new HttpException('Internal server error', 500);
    }
  }
}