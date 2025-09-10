import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { EncryptService } from 'src/encrypt/encrypt.service';

@Injectable()
export class UploadService {
  private readonly uploadPath = './uploads';
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly encryptService: EncryptService) {
    // Tạo thư mục uploads nếu chưa tồn tại
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadImage(encryptData: any): Promise<any> {
    try {
      this.logger.log('=== UPLOAD IMAGE START ===');
      this.logger.log('Received encrypted data:', encryptData);

      const fileData = await this.encryptService.Decrypt(encryptData);
      this.logger.log('Decrypted file data:', JSON.stringify(fileData, null, 2));

      if (!fileData.buffer || !fileData.originalName) {
        throw new Error('Invalid file data');
      }      // Tạo unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtName = path.extname(fileData.originalName);
      const fileName = `image-${uniqueSuffix}${fileExtName}`;
      const filePath = path.join(this.uploadPath, fileName);

      // Convert base64 back to buffer và save file
      const imageBuffer = Buffer.from(fileData.buffer, 'base64');
      fs.writeFileSync(filePath, imageBuffer);

      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'Image uploaded successfully',
        data: {
          filename: fileName,
          originalName: fileData.originalName,
          size: imageBuffer.length,
          mimeType: fileData.mimeType,
          url: `${fileName}`,
        },
      });
    } catch (error) {
      return this.encryptService.Encrypt({
        status: 'ERR',
        message: `Failed to upload image: ${error.message}`,
      });
    }
  }

  async getImage(encryptData: any): Promise<any> {
    try {
      const { filename } = await this.encryptService.Decrypt(encryptData);
      const imagePath = path.join(this.uploadPath, filename);

      if (!fs.existsSync(imagePath)) {
        return this.encryptService.Encrypt({
          status: 'ERR',
          message: 'Image not found',
        });
      }

      // Read file and convert to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const mimeType = this.getMimeType(filename);

      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'Image retrieved successfully',
        data: {
          filename,
          buffer: imageBuffer.toString('base64'),
          mimeType,
        },
      });
    } catch (error) {
      return this.encryptService.Encrypt({
        status: 'ERR',
        message: `Failed to get image: ${error.message}`,
      });
    }
  }

  async getImageInfo(encryptData: any): Promise<any> {
    try {
      const { filename } = await this.encryptService.Decrypt(encryptData);
      const imagePath = path.join(this.uploadPath, filename);

      if (!fs.existsSync(imagePath)) {
        return this.encryptService.Encrypt({
          status: 'ERR',
          message: 'Image not found',
        });
      }

      const stats = fs.statSync(imagePath);

      return this.encryptService.Encrypt({
        status: 'OK',
        message: 'Image info retrieved successfully',
        data: {
          filename,
          size: stats.size,
          uploadDate: stats.birthtime,
          mimeType: this.getMimeType(filename),
        },
      });
    } catch (error) {
      return this.encryptService.Encrypt({
        status: 'ERR',
        message: `Failed to get image info: ${error.message}`,
      });
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}