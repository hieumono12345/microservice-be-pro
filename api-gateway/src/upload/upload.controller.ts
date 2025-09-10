/* eslint-disable */
import {
  Controller,
  Post,
  Get,
  Param,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RoleGuard } from '../jwt/role.guard';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) { }

  @Post('image')
  @UseGuards(JwtAuthGuard, new RoleGuard('admin'))
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: any) {
    this.logger.log('Uploading image...');

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.uploadService.uploadImage(file);
  }

  @Get('image/:filename')
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const result = await this.uploadService.getImage(filename);

      if (result.status === 'ERR') {
        return res.status(404).json(result);
      }

      // Set headers và trả về file
      res.setHeader('Content-Type', result.data!.mimeType);
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Convert base64 back to buffer
      const imageBuffer = Buffer.from(result.data!.buffer, 'base64');
      return res.send(imageBuffer);
    } catch (error) {
      this.logger.error(`Error serving image ${filename}:`, error.message);
      return res.status(404).json({
        status: 'ERR',
        message: 'Image not found',
      });
    }
  }

  @Get('info/:filename')
  async getImageInfo(@Param('filename') filename: string) {
    return this.uploadService.getImageInfo(filename);
  }
}
