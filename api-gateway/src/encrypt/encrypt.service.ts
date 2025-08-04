/* eslint-disable */
import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import * as crypto from 'crypto';
import { VaultService } from 'src/vault/vault.service';

Injectable()
export class EncryptService implements OnModuleInit {
  private readonly logger = new Logger(EncryptService.name);

  onModuleInit() {
    // Initialization logic if needed
  }

  constructor(
    private readonly vaultService = new VaultService() // Assuming VaultService is defined elsewhere
  ) {}
  
  async encrypt(data: any): Promise<string> {
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

  async decrypt(encryptedData: string): Promise<any> {
      try {
        const [ivHex, encryptedHex] = encryptedData.split(':');
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

  private keyFix: string = "ff20075b050ef56eda44455a2ea925082437d5777f59e95f464264ad3047ca81";

  async Encrypt(data: any): Promise<string> {
    try {
      this.logger.debug('Starting encryption process');
      const keyHex = this.keyFix;
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

  async Decrypt(encryptedData: string): Promise<any> {
      try {
        const [ivHex, encryptedHex] = encryptedData.split(':');
        const key = this.keyFix;
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
}
