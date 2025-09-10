/* eslint-disable */
import { Injectable, Inject, HttpException, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto, ResetPasswordDto, UpdateUserDto } from './dto';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { VaultService } from 'src/vault/vault.service';
import { EncryptService } from 'src/encrypt/encrypt.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientKafka,
    private readonly configService: ConfigService,
    private readonly vaultService: VaultService,
    private readonly encryptService: EncryptService, // Assuming EncryptService is defined elsewhere
  ) { }

  private async encrypt(data: any): Promise<string> {
    try {
      this.logger.debug('Starting encryption process');
      const keyHex = await this.vaultService.getAesKey();
      this.logger.debug('Retrieved AES key from Vault');

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
      [
        'auth.register', 'auth.login', 'auth.verifyEmail', 'auth.refresh-token',
        'auth.logout', 'auth.me', 'auth.resetPassword', 'auth.forgot-password',
        'auth.get-all', 'auth.delete-user', 'auth.get-user', 'auth.update-user'
      ].forEach((pattern) =>
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
      // const encryptedData = await this.encrypt(registerDto);
      const encryptedData = await this.encryptService.Encrypt(registerDto);
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
      // throw new HttpException('Internal server error', 500);
      throw new HttpException(error.message, 500);
    }
  }

  async login(loginDto: LoginDto) {
    try {
      // const encryptedData = await this.encrypt(loginDto);
      const encryptedData = await this.encryptService.Encrypt(loginDto);
      this.logger.log(`Sending login request to Kafka: ${encryptedData}`);
      const response = await firstValueFrom(
        this.authClient.send('auth.login', encryptedData),
      );

      if (response.statusCode >= 400) {
        this.logger.warn(`Login failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      this.logger.log('Login successful');
      this.logger.debug(`Login response: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      // throw new HttpException('Internal server error', 500);
      throw new HttpException(error.message, 500);
    }
  }

  async verifyEmail(token: string) {
    try {
      if (!token) {
        this.logger.warn('Email verification token is missing');
        throw new HttpException('Token is required', 400);
      }
      this.logger.log(`Verifying email with token: ${token}`);
      const response = firstValueFrom(
        this.authClient.send('auth.verifyEmail', token),
      );

      // if (response.statusCode >= 400) {
      //   this.logger.warn(`Email verification failed: ${response.message}`);
      //   throw new HttpException(response.message, response.statusCode);
      // }

      this.logger.log('Email verification successful');
      return response;
    } catch (error) {
      this.logger.error(`Email verification error: ${error.message}`);
      // throw new HttpException('Internal server error', 500);
      throw new HttpException(error.message, 500);
    }
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      // Gán IP và UA
      const enrichedDto = {
        ...dto,
      };

      const encryptedData = await this.encrypt(enrichedDto);
      this.logger.log(`Sending refresh token request: ${encryptedData}`);

      const response = await firstValueFrom(
        this.authClient.send('auth.refresh-token', encryptedData),
      );

      if (response.statusCode >= 400) {
        this.logger.warn(`Refresh failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      return response;
    } catch (error) {
      this.logger.error(`Refresh error: ${error.message}`);
      throw new HttpException(error.message, 500);
    }
  }

  async logout(dto: LogoutDto) {
    try {
      const encryptedData = await this.encrypt(dto);
      this.logger.log(`Sending logout request: ${encryptedData}`);

      const response = await firstValueFrom(
        this.authClient.send('auth.logout', encryptedData),
      );

      if (response.statusCode >= 400) {
        this.logger.warn(`Logout failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      return response;
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
      throw new HttpException(error.message, 500);
    }
  }

  async me(acceptToken: string) {
    try {
      if (!acceptToken) {
        this.logger.warn('Authorization token is missing');
        throw new HttpException('Authorization token is required', 401);
      }

      this.logger.log(`Fetching user info with token: ${acceptToken}`);
      const response = await firstValueFrom(
        this.authClient.send('auth.me', acceptToken),
      );

      if (response.statusCode >= 400) {
        this.logger.warn(`Fetch user info failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      return response;
    } catch (error) {
      this.logger.error(`Fetch user info error: ${error.message}`);
      throw new HttpException(error.message, 500);
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      if (!dto.token || !dto.newPassword) {
        this.logger.warn('Token and new password are required for reset password');
        throw new HttpException('Token and new password are required', 400);
      }

      const encryptedData = await this.encrypt(dto);
      this.logger.log(`Sending reset password request: ${encryptedData}`);

      const response = await firstValueFrom(
        this.authClient.send('auth.resetPassword', encryptedData),
      );

      if (response.statusCode >= 400) {
        this.logger.warn(`Reset password failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      return response;
    } catch (error) {
      this.logger.error(`Reset password error: ${error.message}`);
      throw new HttpException(error.message, 500);
    }
  }

  async forgotPassword(email: string) {
    try {
      if (!email) {
        this.logger.debug('Email is required for forgot password', email);
        this.logger.warn('Email is required for forgot password');
        throw new HttpException('Email is required', 400);
      }

      // encrypt email
      const encryptedEmail = await this.encrypt({ email });

      this.logger.log(`Sending forgot password request for email: ${email}`);
      const response = await firstValueFrom(
        this.authClient.send('auth.forgot-password', encryptedEmail),
      );

      if (response.statusCode >= 400) {
        this.logger.warn(`Forgot password failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }
      return response;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }

  async deleteUser(id: string) {
    try {
      if (!id) {
        this.logger.warn('User ID is required for deletion');
        throw new HttpException('User ID is required', 400);
      }

      const encryptedData = await this.encrypt({ id });
      this.logger.log(`Sending delete user request: ${encryptedData}`);

      const response = await firstValueFrom(
        this.authClient.send('auth.delete-user', encryptedData),
      );

      if (response.statusCode >= 400) {
        this.logger.warn(`Delete user failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      return response;
    } catch (error) {
      this.logger.error(`Delete user error: ${error.message}`);
      throw new HttpException(error.message, 500);
    }
  }

  async getAll() {
    try {
      this.logger.log('Fetching all users...');
      const response = await firstValueFrom(
        this.authClient.send('auth.get-all', {}),
      );
      if (response.statusCode >= 400) {
        this.logger.warn(`Fetch all users failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      return response;
    } catch (error) {
      this.logger.error(`Fetch all users error: ${error.message}`);
      throw new HttpException(error.message, 500);
    }
  }

  async getUserById(id: string) {
    try {
      if (!id) {
        this.logger.warn('User ID is required to fetch user details');
        throw new HttpException('User ID is required', 400);
      }
      this.logger.log(`Fetching user with ID: ${id}`);
      const response = await firstValueFrom(
        this.authClient.send('auth.get-user', id),
      );
      if (response.statusCode >= 400) {
        this.logger.warn(`Fetch user by ID failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      return response;
    } catch (error) {
      this.logger.error(`Fetch user by ID error: ${error.message}`);
      throw new HttpException(error.message, 500);
    }
  }

  async updateUser(id: string, updateData: UpdateUserDto) {
    try {
      if (!id) {
        this.logger.warn('User ID is required for update');
        throw new HttpException('User ID is required', 400);
      }

      const encryptedData = await this.encrypt({ id, updateData });
      this.logger.log(`Sending update user request for ID: ${id}`);

      const response = await firstValueFrom(
        this.authClient.send('auth.update-user', encryptedData),
      );

      if (response.statusCode >= 400) {
        this.logger.warn(`Update user failed: ${response.message}`);
        throw new HttpException(response.message, response.statusCode);
      }

      return response;
    } catch (error) {
      this.logger.error(`Update user error: ${error.message}`);
      throw new HttpException(error.message, 500);
    }
  }
}
