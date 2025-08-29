/* eslint-disable */
import { IsString, IsNotEmpty, IsInt, IsOptional, } from 'class-validator';
import { Transform } from 'class-transformer';

// dto/create-category.dto.ts
export class CreateBrandDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;
}

// dto/update-category.dto.ts
export class UpdateBrandDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class DeleteBrandDto {
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