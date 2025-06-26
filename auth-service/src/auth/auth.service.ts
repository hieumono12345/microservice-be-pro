import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { RegisterDto, LoginDto } from './dto';
import { JwtService } from './jwt.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';
import { VaultService } from 'src/vault/vault.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly vaultService: VaultService
  ) {}

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

  async register(dto: RegisterDto) {
    try {
      const { username, password } = dto;
      const existingUser = await this.userRepository.findOne({ where: { username } });
      if (existingUser) {
        this.logger.warn(`Register failed: Username ${username} already exists`);
        throw new BadRequestException('Username already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = this.userRepository.create({
        username,
        password: hashedPassword,
      });
      await this.userRepository.save(user);

      this.logger.log(`User ${username} registered successfully`);
      return { message: 'User registered successfully', statusCode: 200 };
    } catch (error) {
      this.logger.error(`Register error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async login(dto: LoginDto) {
    try {
      const { username, password } = dto;
      const user = await this.userRepository.findOne({ where: { username } });
      if (!user) {
        this.logger.warn(`Login failed: Invalid credentials for username ${username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for username ${username}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.jwtService.sign({ userId: user.id, username });

      this.logger.log(`User ${username} logged in successfully`);
      return { token, statusCode: 200 };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      throw new UnauthorizedException(error.message);
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
}