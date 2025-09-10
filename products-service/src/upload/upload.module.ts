import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { EncryptModule } from 'src/encrypt/encrypt.module';

@Module({
  imports: [EncryptModule],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule { }
