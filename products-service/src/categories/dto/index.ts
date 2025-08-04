/* eslint-disable */
import { IsString, IsNotEmpty } from 'class-validator';

// dto/create-category.dto.ts
export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description?: string;
}

// dto/update-category.dto.ts
export class UpdateCategoryDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description?: string;
}

export class DeleteCategoryDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}