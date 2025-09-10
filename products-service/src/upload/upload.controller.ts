/* eslint-disable */
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UploadService } from './upload.service';

@Controller()
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly uploadService: UploadService) { }

  @MessagePattern('upload.image')
  async handleUploadImage(encryptData: any) {
    this.logger.log('Received upload image request');
    return this.uploadService.uploadImage(encryptData);
  }

  @MessagePattern('upload.getImage')
  async handleGetImage(encryptData: any) {
    this.logger.log('Received get image request');
    return this.uploadService.getImage(encryptData);
  }

  @MessagePattern('upload.getImageInfo')
  async handleGetImageInfo(encryptData: any) {
    this.logger.log('Received get image info request');
    return this.uploadService.getImageInfo(encryptData);
  }
}
