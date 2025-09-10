/* eslint-disable */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Tạo thư mục uploads nếu chưa tồn tại
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadImage(file: any) {
    this.logger.log('Uploading image...');
    try {
      // Tạo tên file unique
      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = path.join(this.uploadDir, fileName);

      // Lưu file vào disk
      fs.writeFileSync(filePath, file.buffer);

      this.logger.log(`Image uploaded successfully: ${fileName}`);
      
      return {
        status: 'OK',
        message: 'Image uploaded successfully',
        data: {
          filename: fileName,
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          url: `${fileName}`
        }
      };
    } catch (error) {
      this.logger.error(`Failed to upload image: ${error.message}`);
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  async getImage(filename: string) {
    this.logger.log(`Getting image: ${filename}`);
    try {
      const filePath = path.join(this.uploadDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return {
          status: 'ERR',
          message: 'Image not found'
        };
      }

      const fileBuffer = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);
      
      // Xác định mime type từ extension
      const ext = path.extname(filename).toLowerCase();
      let mimeType = 'image/jpeg';
      
      switch (ext) {
        case '.png':
          mimeType = 'image/png';
          break;
        case '.gif':
          mimeType = 'image/gif';
          break;
        case '.webp':
          mimeType = 'image/webp';
          break;
        case '.jpg':
        case '.jpeg':
          mimeType = 'image/jpeg';
          break;
      }

      return {
        status: 'OK',
        message: 'Image retrieved successfully',
        data: {
          buffer: fileBuffer.toString('base64'),
          mimeType: mimeType,
          size: stats.size
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get image: ${error.message}`);
      return {
        status: 'ERR',
        message: 'Image not found'
      };
    }
  }

  async getImageInfo(filename: string) {
    this.logger.log(`Getting image info: ${filename}`);
    try {
      const filePath = path.join(this.uploadDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return {
          status: 'ERR',
          message: 'Image not found'
        };
      }

      const stats = fs.statSync(filePath);
      
      return {
        status: 'OK',
        message: 'Image info retrieved successfully',
        data: {
          filename: filename,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get image info: ${error.message}`);
      return {
        status: 'ERR',
        message: 'Image not found'
      };
    }
  }
}
