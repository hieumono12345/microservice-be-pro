/* eslint-disable */
import { Transform } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt } from 'class-validator';

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

export class GetAllDto {
  @IsInt()
  @Transform(({ value }) => value || 1)
  page: number = 1;

  @IsInt()
  @Transform(({ value }) => value || 100)
  pageSize: number = 100;

  @IsString()
  @Transform(({ value }) => value || '')
  filterName: string = '';

  @IsString()
  @Transform(({ value }) => value || 'desc')
  sortBy: string = 'desc';
}