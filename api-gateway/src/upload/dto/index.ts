import { IsOptional, IsString } from 'class-validator';

export class UploadImageDto {
  @IsString()
  @IsOptional()
  file?: string;
}

export class GetImageDto {
  @IsString()
  filename: string;
}
