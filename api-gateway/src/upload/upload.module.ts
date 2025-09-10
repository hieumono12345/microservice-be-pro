import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { JwtModule } from '../jwt/jwt.module';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(), // Store in memory để process trực tiếp
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
    JwtModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule { }
